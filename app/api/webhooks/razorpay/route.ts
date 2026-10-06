import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { PaymentFailedEmail } from "@/features/checkout/emails/payment-failed-email";
import { sendPaidOrderConfirmationEmail } from "@/features/checkout/services/send-paid-order-confirmation";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/features/settings";
import type { Database } from "@/types/database.types";


// In-memory mock store for automated webhook test assertions
const MOCK_WEBHOOK_EVENT_LOG: Array<{
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
      Sentry.captureMessage("[WEBHOOK SECURITY ALERT] Invalid Razorpay webhook signature received", {
        level: "warning",
        tags: { service: "razorpay_webhook" },
      });
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
      let captureStatus = "unmatched_order";

      if (adminSupabase && razorpayOrderId && razorpayPaymentId) {
        try {
          const { data: matchedOrder, error: findError } = await adminSupabase
            .from("orders")
            .select("id, order_number, status, payment_status, payment_method, total_amount, razorpay_payment_id")
            .eq("razorpay_order_id", razorpayOrderId)
            .maybeSingle();

          if (findError) throw findError;

          if (matchedOrder) {
            const expectedAmountPaise = Math.round(Number(matchedOrder.total_amount) * 100);
            if (
              matchedOrder.payment_method !== "razorpay" ||
              paymentEntity?.currency !== "INR" ||
              Number(paymentEntity?.amount) !== expectedAmountPaise
            ) {
              captureStatus = "amount_or_method_mismatch";
              Sentry.captureMessage("Razorpay capture did not match stored order amount or method", {
                level: "error",
                tags: { service: "razorpay_webhook" },
                extra: { orderNumber: matchedOrder.order_number, razorpayOrderId },
              });
            } else if (matchedOrder.payment_status === "paid") {
              isAlreadyPaid = matchedOrder.razorpay_payment_id === razorpayPaymentId;
              captureStatus = isAlreadyPaid ? "duplicate_skipped" : "additional_capture_review";
              if (!isAlreadyPaid) {
                Sentry.captureMessage("Additional Razorpay capture requires refund review", {
                  level: "error",
                  tags: { service: "razorpay_webhook" },
                  extra: { orderNumber: matchedOrder.order_number, razorpayOrderId, razorpayPaymentId },
                });
              }
            } else if (
              matchedOrder.status === "pending" &&
              matchedOrder.payment_status === "pending"
            ) {
              const { data: updatedOrder, error: updateError } = await adminSupabase
                .from("orders")
                .update({
                  payment_status: "paid",
                  status: "confirmed",
                  razorpay_payment_id: razorpayPaymentId,
                })
                .eq("id", matchedOrder.id)
                .eq("razorpay_order_id", razorpayOrderId)
                .eq("payment_status", "pending")
                .eq("status", "pending")
                .select("id")
                .maybeSingle();

              if (updateError) throw updateError;
              if (updatedOrder) {
                captureStatus = "order_confirmed";
                await adminSupabase.from("order_status_history").insert({
                  order_id: matchedOrder.id,
                  status: "confirmed",
                  note: `Payment captured via Razorpay Webhook (Payment ID: ${razorpayPaymentId})`,
                });
                await sendPaidOrderConfirmationEmail(adminSupabase, matchedOrder.order_number);
              } else {
                const { data: currentOrder, error: currentOrderError } = await adminSupabase
                  .from("orders")
                  .select("status, payment_status, razorpay_payment_id")
                  .eq("id", matchedOrder.id)
                  .maybeSingle();

                if (currentOrderError) throw currentOrderError;
                if (currentOrder?.payment_status === "paid") {
                  isAlreadyPaid = currentOrder.razorpay_payment_id === razorpayPaymentId;
                  captureStatus = isAlreadyPaid ? "duplicate_skipped" : "additional_capture_review";
                } else if (
                  currentOrder &&
                  ["cancelled", "payment_failed"].includes(currentOrder.status) &&
                  ["pending", "failed"].includes(currentOrder.payment_status)
                ) {
                  const lateStatus = currentOrder.status === "payment_failed" ? "cancelled" : currentOrder.status;
                  const { data: lateOrder, error: lateError } = await adminSupabase
                    .from("orders")
                    .update({
                      payment_status: "paid",
                      status: lateStatus,
                      razorpay_payment_id: razorpayPaymentId,
                    })
                    .eq("id", matchedOrder.id)
                    .eq("razorpay_order_id", razorpayOrderId)
                    .in("status", ["cancelled", "payment_failed"])
                    .in("payment_status", ["pending", "failed"])
                    .select("id")
                    .maybeSingle();

                  if (lateError) throw lateError;
                  if (lateOrder) {
                    captureStatus = "late_capture_refund_review";
                    await adminSupabase.from("order_status_history").insert({
                      order_id: matchedOrder.id,
                      status: lateStatus,
                      note: `Payment captured after order cancellation/expiry. Manual refund review required (Payment ID: ${razorpayPaymentId}).`,
                    });
                  } else {
                    captureStatus = "state_changed_during_capture";
                  }
                } else {
                  captureStatus = "state_changed_during_capture";
                }
              }
            } else {
              const latePaymentStatus = matchedOrder.status === "payment_failed" ? "cancelled" : matchedOrder.status;
              const { data: lateUpdatedOrder, error: lateUpdateError } = await adminSupabase
                .from("orders")
                .update({
                  payment_status: "paid",
                  status: latePaymentStatus,
                  razorpay_payment_id: razorpayPaymentId,
                })
                .eq("id", matchedOrder.id)
                .eq("razorpay_order_id", razorpayOrderId)
                .in("status", ["cancelled", "payment_failed"])
                .in("payment_status", ["pending", "failed"])
                .select("id")
                .maybeSingle();

              if (lateUpdateError) throw lateUpdateError;
              if (lateUpdatedOrder) {
                captureStatus = "late_capture_refund_review";
                await adminSupabase.from("order_status_history").insert({
                  order_id: matchedOrder.id,
                  status: latePaymentStatus,
                  note: `Payment captured after order cancellation/expiry. Manual refund review required (Payment ID: ${razorpayPaymentId}).`,
                });
                Sentry.captureMessage("Razorpay payment captured for a cancelled order; refund review required", {
                  level: "error",
                  tags: { service: "razorpay_webhook" },
                  extra: { orderNumber: matchedOrder.order_number, razorpayOrderId, razorpayPaymentId },
                });
              } else {
                captureStatus = "state_changed_during_capture";
              }
            }
          } else {
            captureStatus = "unmatched_order";
          }
        } catch (dbErr) {
          console.error("Database error processing payment.captured webhook:", dbErr);
          throw dbErr;
        }
      } else if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Payment order could not be processed." }, { status: 503 });
      }

      MOCK_WEBHOOK_EVENT_LOG.push({
        event: "payment.captured",
        orderNumber: receiptOrderNumber,
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        status: captureStatus,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        received: true,
        event: eventName,
        status: isAlreadyPaid ? "duplicate_skipped" : captureStatus,
      });
    }

    if (eventName === "payment.failed") {
      const errorDescription =
        paymentEntity?.error_description || "Payment failed at checkout gateway";

      if (adminSupabase && razorpayOrderId) {
        try {
          const { data: matchedOrder, error: findError } = await adminSupabase
            .from("orders")
            .select("id, order_number, status, payment_status")
            .eq("razorpay_order_id", razorpayOrderId)
            .maybeSingle();

          if (findError) throw findError;

          if (matchedOrder && matchedOrder.status === "pending" && matchedOrder.payment_status === "pending") {
            const { error: historyError } = await adminSupabase.from("order_status_history").insert({
              order_id: matchedOrder.id,
              status: "pending",
              note: `Payment attempt failed; order remains open for retry until its reservation expires. ${errorDescription}`,
            });
            if (historyError) throw historyError;
          }
        } catch (dbErr) {
          console.error("Database error processing payment.failed webhook:", dbErr);
          throw dbErr;
        }
      } else if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Payment failure could not be processed." }, { status: 503 });
      }

      // Dispatch Payment Failed Notification Email to Customer
      const customerEmail =
        paymentEntity?.email ||
        paymentEntity?.notes?.email ||
        "customer@example.com";
      const customerName =
        paymentEntity?.notes?.name ||
        paymentEntity?.notes?.full_name ||
        "Valued Customer";
      const totalAmountRupees = paymentEntity?.amount
        ? paymentEntity.amount / 100
        : 0;
      const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
      const retryUrl = `${appUrl}/checkout?retry=${receiptOrderNumber || razorpayOrderId}`;
      const { storeProfile } = await getSiteSettings();

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
            supportEmail: storeProfile.email,
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
        status: "payment_attempt_failed_retryable",
        timestamp: Date.now(),
      });


      return NextResponse.json({
        received: true,
        event: eventName,
        status: "payment_attempt_failed_retryable",
      });
    }

    // 5. Handle Refund Lifecycle Events (refund.processed, refund.created, refund.failed)
    if (eventName === "refund.processed" || eventName === "refund.created" || eventName === "refund.failed") {
      const refundEntity = payload.payload?.refund?.entity;
      const refundId = refundEntity?.id;
      const paymentId = refundEntity?.payment_id;
      const orderNumberNote = refundEntity?.notes?.order_number;
      const refundArn = refundEntity?.acquirer_data?.arn || null;
      const refundAmount = refundEntity?.amount ? refundEntity.amount / 100 : null;
      const newRefundStatus =
        eventName === "refund.processed"
          ? "processed"
          : eventName === "refund.failed"
          ? "failed"
          : "initiated";

      let matchedOrderId: string | null = null;
      let matchedOrderNumber: string | null = orderNumberNote || null;

      if (adminSupabase && (orderNumberNote || paymentId || refundId)) {
        try {
          // Attempt to find order by order_number first, then payment_id, then refund_id
          let query = adminSupabase.from("orders").select("id, order_number, status, payment_status");
          if (orderNumberNote) {
            query = query.eq("order_number", orderNumberNote);
          } else if (paymentId) {
            query = query.eq("razorpay_payment_id", paymentId);
          }

          const { data: matchedOrder, error: findError } = await query.maybeSingle();

          if (!findError && matchedOrder) {
            matchedOrderId = matchedOrder.id;
            matchedOrderNumber = matchedOrder.order_number;

            // Attempt update with refund columns
            const fullUpdate: Database["public"]["Tables"]["orders"]["Update"] = {
              payment_status: newRefundStatus === "failed" ? matchedOrder.payment_status : "refunded",
              razorpay_refund_id: refundId,
              refund_status: newRefundStatus,
              refund_amount: refundAmount,
              refund_arn: refundArn,
              refunded_at: new Date().toISOString(),
            };

            const { error: updateError } = await adminSupabase
              .from("orders")
              .update(fullUpdate)
              .eq("id", matchedOrderId);

            if (updateError) {
              if (updateError.code === "42703") {
                // Defensive fallback if migration 035 columns are missing
                await adminSupabase
                  .from("orders")
                  .update({
                    payment_status: newRefundStatus === "failed" ? matchedOrder.payment_status : "refunded",
                  })
                  .eq("id", matchedOrderId);
              } else {
                console.error("[Razorpay:Webhook] Error updating order refund status:", updateError);
              }
            }

            // Append status history entry
            await adminSupabase.from("order_status_history").insert({
              order_id: matchedOrderId,
              status: matchedOrder.status,
              note: `Razorpay Refund update (${eventName}): Status set to ${newRefundStatus}.${
                refundAmount ? ` Amount: ₹${refundAmount}.` : ""
              }${refundArn ? ` Bank ARN: ${refundArn}.` : ""}`,
            });
          }
        } catch (dbErr) {
          console.error("Database error processing refund webhook:", dbErr);
        }
      }

      MOCK_WEBHOOK_EVENT_LOG.push({
        event: eventName,
        orderNumber: matchedOrderNumber || undefined,
        paymentId: paymentId || undefined,
        status: newRefundStatus,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        received: true,
        event: eventName,
        status: newRefundStatus,
        orderNumber: matchedOrderNumber,
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
    Sentry.captureException(err, { tags: { service: "razorpay_webhook" } });
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
