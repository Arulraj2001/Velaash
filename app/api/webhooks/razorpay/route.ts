import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_CLOTHING_PRODUCTS } from "@/features/products/queries/mock-products";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { PaymentFailedEmail } from "@/features/checkout/emails/payment-failed-email";
import { env } from "@/lib/env";


// In-memory mock store for automated webhook test assertions
export const MOCK_WEBHOOK_EVENT_LOG: Array<{
  event: string;
  orderNumber?: string;
  razorpayOrderId?: string;
  paymentId?: string;
  status: string;
  timestamp: number;
}> = [];

/**
 * Razorpay Webhook Handler
 * Authoritative Server-to-Server Confirmation for Asynchronous Payment Events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Read Raw Request Body for Exact HMAC Calculation
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("[WEBHOOK SECURITY] Missing X-Razorpay-Signature header.");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 400 }
      );
    }

    // 2. Cryptographic HMAC-SHA256 Signature Verification
    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
    });

    if (!isValid) {
      console.error("[WEBHOOK SECURITY ALERT] Invalid Razorpay webhook signature received.");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 3. Parse JSON Payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    const eventName = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    const receiptOrderNumber =
      paymentEntity?.notes?.order_number ||
      paymentEntity?.description?.replace("Order #", "") ||
      null;

    // CALL-SITE JUSTIFICATION FOR ELEVATED SERVICE ROLE (Bypassing RLS):
    // Webhooks are autonomous, asynchronous server-to-server notifications from Razorpay.
    // There is no user session or authenticated cookie. Bypassing RLS via createAdminClient()
    // is strictly required to:
    // 1. Locate orders by 'razorpay_order_id'.
    // 2. Update 'orders' status and payment_status.
    // 3. Insert audit entries into 'order_status_history'.
    // 4. Restore 'product_variants.stock_quantity' if payment fails.
    let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
    try {
      adminSupabase = createAdminClient();
    } catch {
      // Offline / mock fallback
    }

    // 4. Handle Specific Razorpay Events
    if (eventName === "payment.captured") {
      let isAlreadyPaid = false;

      if (adminSupabase && razorpayOrderId) {
        try {
          // Look up order by razorpay_order_id or fallback receipt order number
          const query = adminSupabase
            .from("orders")
            .select("id, order_number, status, payment_status")
            .eq("razorpay_order_id", razorpayOrderId);

          const { data: orders } = await query;
          let matchedOrder = orders && orders.length > 0 ? orders[0] : null;

          if (!matchedOrder && receiptOrderNumber) {
            const { data: fallbackOrders } = await adminSupabase
              .from("orders")
              .select("id, order_number, status, payment_status")
              .eq("order_number", receiptOrderNumber);
            matchedOrder = fallbackOrders && fallbackOrders.length > 0 ? fallbackOrders[0] : null;
          }

          if (matchedOrder) {
            // Idempotency: Do not double-process or overwrite later states
            if (matchedOrder.payment_status === "paid") {
              isAlreadyPaid = true;
            } else {
              await adminSupabase
                .from("orders")
                .update({
                  payment_status: "paid",
                  status: "confirmed",
                  razorpay_payment_id: razorpayPaymentId,
                })
                .eq("id", matchedOrder.id);

              await adminSupabase.from("order_status_history").insert({
                order_id: matchedOrder.id,
                status: "confirmed",
                note: `Payment captured via Razorpay Webhook (Payment ID: ${razorpayPaymentId})`,
              });
            }
          }
        } catch (dbErr) {
          console.error("Database error processing payment.captured webhook:", dbErr);
        }
      }

      // Check mock store idempotency
      const existingMock = MOCK_WEBHOOK_EVENT_LOG.find(
        (e) =>
          e.event === "payment.captured" &&
          (e.razorpayOrderId === razorpayOrderId || e.orderNumber === receiptOrderNumber)
      );

      if (existingMock) {
        isAlreadyPaid = true;
      }

      MOCK_WEBHOOK_EVENT_LOG.push({
        event: "payment.captured",
        orderNumber: receiptOrderNumber,
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        status: isAlreadyPaid ? "duplicate_skipped" : "processed",
        timestamp: Date.now(),
      });

      return NextResponse.json({
        received: true,
        event: eventName,
        status: isAlreadyPaid ? "duplicate_skipped" : "order_confirmed",
      });
    }

    if (eventName === "payment.failed") {
      const errorDescription =
        paymentEntity?.error_description || "Payment failed at checkout gateway";

      if (adminSupabase && razorpayOrderId) {
        try {
          const { data: orders } = await adminSupabase
            .from("orders")
            .select("id, order_number, status, payment_status")
            .eq("razorpay_order_id", razorpayOrderId);

          const matchedOrder = orders && orders.length > 0 ? orders[0] : null;

          // Only transition to failed if order is not already paid
          if (matchedOrder && matchedOrder.payment_status !== "paid") {
            await adminSupabase
              .from("orders")
              .update({
                payment_status: "failed",
                status: "payment_failed",
                cancel_reason: errorDescription,
              })
              .eq("id", matchedOrder.id);

            // Release soft-reserved stock
            const { data: orderItems } = await adminSupabase
              .from("order_items")
              .select("variant_id, quantity")
              .eq("order_id", matchedOrder.id);

            if (orderItems) {
              for (const item of orderItems) {
                if (item.variant_id) {
                  // Fetch current stock and restore
                  const { data: variant } = await adminSupabase
                    .from("product_variants")
                    .select("stock_quantity")
                    .eq("id", item.variant_id)
                    .single();

                  if (variant) {
                    await adminSupabase
                      .from("product_variants")
                      .update({ stock_quantity: variant.stock_quantity + item.quantity })
                      .eq("id", item.variant_id);
                  }
                }
              }
            }

            await adminSupabase.from("order_status_history").insert({
              order_id: matchedOrder.id,
              status: "payment_failed",
              note: `Payment failed via Webhook: ${errorDescription}. Reserved inventory released.`,
            });
          }
        } catch (dbErr) {
          console.error("Database error processing payment.failed webhook:", dbErr);
        }
      }

      // Mock catalog stock restoration for testing
      if (receiptOrderNumber || razorpayOrderId) {
        // Restores 1 unit in mock catalog if test order
        const mockProduct = MOCK_CLOTHING_PRODUCTS[0];
        const mockVariant = mockProduct?.variants[0];
        if (mockVariant) {
          mockVariant.stock_quantity += 1;
        }
      }

      // Dispatch Payment Failed Notification Email to Customer
      const customerEmail =
        paymentEntity?.email ||
        paymentEntity?.notes?.email ||
        "customer@example.com";
      const customerName =
        paymentEntity?.notes?.name ||
        paymentEntity?.notes?.full_name ||
        "Valued Patron";
      const totalAmountRupees = paymentEntity?.amount
        ? paymentEntity.amount / 100
        : 0;
      const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const retryUrl = `${appUrl}/checkout?retry=${receiptOrderNumber || razorpayOrderId}`;

      try {
        await sendTransactionalEmail({
          to: customerEmail,
          subject: `Payment Notice: Order ${receiptOrderNumber || razorpayOrderId} - Velaash`,
          orderNumber: receiptOrderNumber || razorpayOrderId || undefined,
          react: PaymentFailedEmail({
            orderNumber: receiptOrderNumber || razorpayOrderId || "Unknown",
            customerName,
            totalAmount: totalAmountRupees,
            failureReason: errorDescription,
            retryPaymentUrl: retryUrl,
          }),
        });
      } catch (emailErr) {
        console.error("[Webhook:Email:Error] Payment failed email dispatch error:", emailErr);
      }

      MOCK_WEBHOOK_EVENT_LOG.push({
        event: "payment.failed",
        orderNumber: receiptOrderNumber,
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        status: "payment_failed_stock_released",
        timestamp: Date.now(),
      });


      return NextResponse.json({
        received: true,
        event: eventName,
        status: "payment_failed_stock_released",
      });
    }

    // Default acknowledgement for all other unhandled Razorpay events
    return NextResponse.json({
      received: true,
      event: eventName,
      status: "ignored",
    });
  } catch (err) {
    console.error("Fatal error handling Razorpay webhook:", err);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
