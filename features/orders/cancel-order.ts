import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayRefund } from "@/lib/razorpay";

export interface CancellationResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
  refundInitiated?: boolean;
  refundAmount?: number;
  refundId?: string;
  message?: string;
}

export async function executeOrderCancellation(
  adminSupabase: ReturnType<typeof createAdminClient>,
  params: {
    orderNumber: string;
    userId: string;
    userEmail?: string | null;
    reason?: string;
    isAdmin?: boolean;
  }
): Promise<CancellationResult> {
  const { orderNumber, userId, userEmail, reason, isAdmin } = params;

  // 1. Fetch order payment details before cancellation
  const { data: orderDetails } = await adminSupabase
    .from("orders")
    .select("id, total_amount, payment_method, payment_status, razorpay_payment_id")
    .eq("order_number", orderNumber)
    .maybeSingle();

  // 2. Atomic stock restoration and status = 'cancelled'
  const { data, error } = await adminSupabase.rpc("cancel_order_atomic", {
    p_order_number: orderNumber,
    p_user_id: userId,
    p_user_email: userEmail || null,
    p_reason: reason?.trim() || null,
    p_is_admin: Boolean(isAdmin),
  });

  if (error) {
    console.error("Failed to cancel order atomically:", error);
    return {
      success: false,
      error: "Failed to cancel order and restore inventory. Please try again.",
    };
  }

  const result = data?.[0];
  if (!result?.cancelled) {
    return {
      success: false,
      error: result?.error_message || "Order could not be cancelled.",
    };
  }

  const orderId = (result.order_id || orderDetails?.id) as string | undefined;
  if (!orderId) {
    return {
      success: false,
      error: "Order identifier could not be resolved.",
    };
  }

  let refundInitiated = false;
  let refundId: string | undefined;
  let refundAmount: number | undefined;
  let message: string | undefined;

  // 3. Process Refund for Paid Razorpay Orders
  if (
    orderDetails &&
    orderDetails.payment_method === "razorpay" &&
    orderDetails.payment_status === "paid" &&
    orderDetails.razorpay_payment_id
  ) {
    const totalAmount = Number(orderDetails.total_amount);
    const amountPaise = Math.round(totalAmount * 100);

    try {
      const refundResult = await createRazorpayRefund({
        paymentId: orderDetails.razorpay_payment_id,
        amountPaise,
        notes: {
          order_number: orderNumber,
          reason: reason?.trim() || (isAdmin ? "Cancelled by admin" : "Cancelled by customer"),
        },
        receipt: `rcpt_rfnd_${orderNumber}`,
      });

      refundInitiated = true;
      refundId = refundResult.id;
      refundAmount = totalAmount;

      // Update orders table with refund metadata (defensively handling schema columns)
      try {
        await adminSupabase
          .from("orders")
          .update({
            payment_status: "refunded",
            razorpay_refund_id: refundResult.id,
            refund_status: refundResult.status === "processed" ? "processed" : "initiated",
            refund_amount: totalAmount,
            refund_arn: refundResult.arn || null,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      } catch {
        // Fallback if migration 035 columns not yet applied in remote database
        await adminSupabase
          .from("orders")
          .update({
            payment_status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      }

      // Add audit trail event into order_status_history
      const auditNote = `Refund of ₹${totalAmount.toLocaleString("en-IN")} initiated via Razorpay (Refund ID: ${refundResult.id}). Credited to original payment source within 5–7 working days.`;
      await adminSupabase.from("order_status_history").insert({
        order_id: orderId,
        status: "refunded",
        note: auditNote,
        created_by: userId || null,
      });

      message = `Your order has been cancelled and a full refund of ₹${totalAmount.toLocaleString("en-IN")} has been initiated to your original payment method.`;
    } catch (refundErr) {
      console.error(`[Refund Error] Failed to process Razorpay refund for cancelled order ${orderNumber}:`, refundErr);
      try {
        await adminSupabase
          .from("orders")
          .update({
            refund_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      } catch {}

      await adminSupabase.from("order_status_history").insert({
        order_id: orderId,
        status: "cancelled",
        note: `Order cancelled. Automated refund encountered an issue. Manual owner refund review logged. Details: ${refundErr instanceof Error ? refundErr.message : "Gateway error"}`,
        created_by: userId || null,
      });

      message = "Order cancelled. Your refund is being processed by our support team within 24–48 hours.";
    }
  } else if (orderDetails && orderDetails.payment_method === "cod") {
    try {
      await adminSupabase
        .from("orders")
        .update({
          refund_status: "not_applicable",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch {}

    message = "Your order has been cancelled. As this was a Cash on Delivery order, no payment was collected.";
  }

  return {
    success: true,
    orderNumber,
    refundInitiated,
    refundAmount,
    refundId,
    message,
  };
}