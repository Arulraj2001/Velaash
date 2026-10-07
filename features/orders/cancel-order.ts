import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // 3. Mark Refund Status for Review on Paid Prepaid Orders (Decoupled from Auto-Dispatch)
  if (
    orderDetails &&
    orderDetails.payment_method === "razorpay" &&
    orderDetails.payment_status === "paid" &&
    orderDetails.razorpay_payment_id
  ) {
    const totalAmount = Number(orderDetails.total_amount);
    refundAmount = totalAmount;

    try {
      await adminSupabase
        .from("orders")
        .update({
          refund_status: "pending_review",
          refund_amount: totalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch (err) {
      console.warn("Could not set refund_status on orders table:", err);
    }

    const auditNote = `Prepaid order cancelled prior to shipment. Amount: ₹${totalAmount.toLocaleString("en-IN")}. In accordance with store policy, replacement, store credit, or refund exception is queued for support review.`;
    await adminSupabase.from("order_status_history").insert({
      order_id: orderId,
      status: "cancelled",
      note: auditNote,
      created_by: userId || null,
    });

    message = `Your order has been cancelled and inventory restored. In accordance with our replacement-first policy, please connect with our WhatsApp Concierge with your Order ID for size exchange, store credit, or refund assistance.`;
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