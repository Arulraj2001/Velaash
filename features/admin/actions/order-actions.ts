"use server";

import React from "react";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  UpdateOrderStatusSchema,
  canTransitionStatus,
  type OrderStatus,
  type UpdateOrderStatusInput,
} from "../types/orders";
import {
  serializeOrderNotes,
} from "../utils/order-metadata";
import { executeOrderCancellation } from "@/features/orders/actions/cancel-order-action";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { OrderConfirmationEmail } from "@/features/checkout/emails/order-confirmation-email";
import { env } from "@/lib/env";

export interface OrderActionResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
  updatedCount?: number;
  skippedCount?: number;
}

/**
 * Updates an order's status along the fulfillment flow.
 * - Allowed for both OWNER and STAFF roles ('manage_orders' permission).
 * - Enforces state machine progression (confirmed -> packed -> shipped -> delivered).
 * - Rejects stage skips (e.g. pending -> delivered).
 * - Strictly requires tracking number & courier partner when transitioning to 'shipped'.
 */
export async function updateOrderStatusAction(
  orderNumber: string,
  input: UpdateOrderStatusInput
): Promise<OrderActionResult> {
  try {
    const admin = await requireAdmin("manage_orders");

    // Validate input via Zod schema (enforces tracking number & courier name for 'shipped')
    const parsed = UpdateOrderStatusSchema.safeParse(input);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message || "Invalid order status parameters.",
      };
    }

    const { status: targetStatus, trackingNumber, courierName, note } = parsed.data;

    const adminSupabase = createAdminClient();

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("id, order_number, status, notes")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (fetchErr || !order) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    const currentStatus = order.status as OrderStatus;

    // 2. Validate state machine transition
    if (!canTransitionStatus(currentStatus, targetStatus)) {
      return {
        success: false,
        error: `Cannot transition order from '${currentStatus}' to '${targetStatus}'. Invalid transition sequence.`,
      };
    }

    // 3. Prepare notes and metadata
    let updatedNotes = order.notes;
    let auditNote = "";

    if (targetStatus === "shipped") {
      updatedNotes = serializeOrderNotes(order.notes, {
        trackingNumber: trackingNumber?.trim(),
        courierName: courierName?.trim(),
      });
      auditNote = `Shipped via ${courierName?.trim()} (Tracking #: ${trackingNumber?.trim()}). ${note?.trim() || ""}`.trim();
    } else {
      auditNote = note?.trim() || `Status updated from '${currentStatus}' to '${targetStatus}' by ${admin.fullName || "Admin"}`;
    }

    // 4. Update order status in orders table
    const { error: updateErr } = await adminSupabase
      .from("orders")
      .update({
        status: targetStatus,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      console.error("Failed to update order status:", updateErr);
      return {
        success: false,
        error: "Failed to update order status in database.",
      };
    }

    // 5. Insert audit log record
    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: targetStatus,
      note: auditNote,
      created_by: admin.id,
    });

    // 6. Revalidate routes
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderNumber}`);
    revalidatePath(`/account/orders/${orderNumber}`);
    revalidatePath("/account/orders");

    return {
      success: true,
      orderNumber,
    };
  } catch (error) {
    console.error("Error in updateOrderStatusAction:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    if (msg.includes("FORBIDDEN")) {
      return { success: false, error: "Access denied: insufficient permissions to update order status." };
    }
    return { success: false, error: msg };
  }
}

/**
 * Bulk updates fulfillment status for multiple orders at once (e.g. mark multiple as 'packed').
 * - Allowed for both OWNER and STAFF roles.
 * - Only transitions orders that satisfy the state machine rules for the target status.
 */
export async function bulkUpdateOrderStatusAction(
  orderNumbers: string[],
  targetStatus: OrderStatus
): Promise<OrderActionResult> {
  try {
    const admin = await requireAdmin("manage_orders");

    if (!orderNumbers || orderNumbers.length === 0) {
      return { success: false, error: "No orders selected for bulk action." };
    }

    // Bulk transitions to 'shipped' are prohibited because tracking numbers must be entered per order
    if (targetStatus === "shipped") {
      return {
        success: false,
        error: "Bulk transition to 'shipped' is disabled because unique courier tracking numbers are required for each shipment.",
      };
    }

    const adminSupabase = createAdminClient();

    // Fetch all requested orders
    const { data: orders, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("id, order_number, status, notes")
      .in("order_number", orderNumbers);

    if (fetchErr || !orders) {
      return { success: false, error: "Failed to retrieve orders for bulk update." };
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      const currentStatus = order.status as OrderStatus;

      if (!canTransitionStatus(currentStatus, targetStatus)) {
        skippedCount++;
        continue;
      }

      const { error: updateErr } = await adminSupabase
        .from("orders")
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateErr) {
        skippedCount++;
        continue;
      }

      await adminSupabase.from("order_status_history").insert({
        order_id: order.id,
        status: targetStatus,
        note: `Bulk status update to '${targetStatus}' by ${admin.fullName || "Admin"}`,
        created_by: admin.id,
      });

      updatedCount++;
    }

    revalidatePath("/admin/orders");

    return {
      success: true,
      updatedCount,
      skippedCount,
    };
  } catch (error) {
    console.error("Error in bulkUpdateOrderStatusAction:", error);
    return { success: false, error: "Failed to perform bulk order update." };
  }
}

/**
 * Updates private internal notes visible only to admin users.
 * Does not alter customer-visible order notes or status.
 */
export async function updateOrderAdminNotesAction(
  orderNumber: string,
  adminNotes: string
): Promise<OrderActionResult> {
  try {
    await requireAdmin("manage_orders");
    const adminSupabase = createAdminClient();

    const { data: order, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("id, notes")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (fetchErr || !order) {
      return { success: false, error: "Order not found." };
    }

    const updatedNotes = serializeOrderNotes(order.notes, {
      adminNotes: adminNotes.trim(),
    });

    const { error: updateErr } = await adminSupabase
      .from("orders")
      .update({
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      return { success: false, error: "Failed to save internal admin notes." };
    }

    revalidatePath(`/admin/orders/${orderNumber}`);
    return { success: true, orderNumber };
  } catch (error) {
    console.error("Error updating admin notes:", error);
    return { success: false, error: "Could not update admin notes." };
  }
}

/**
 * Marks an order as refunded in the system.
 * - OWNER ONLY ('manage_refunds' permission). Staff members are strictly blocked.
 * - Only permitted for cancelled or returned orders.
 * - Note: This does NOT automatically execute a refund via Razorpay's Refund API.
 *   The store owner must manually issue the refund in the Razorpay dashboard,
 *   and this action records the completion in our database and audit trail.
 */
export async function markOrderAsRefundedAction(
  orderNumber: string,
  refundReason?: string
): Promise<OrderActionResult> {
  try {
    // OWNER ONLY ENFORCEMENT:
    const admin = await requireAdmin("manage_refunds");

    const adminSupabase = createAdminClient();

    const { data: order, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("id, status, payment_status")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (fetchErr || !order) {
      return { success: false, error: "Order not found." };
    }

    if (!["cancelled", "delivered"].includes(order.status)) {
      return {
        success: false,
        error: "Only cancelled or completed/delivered orders can be marked as refunded.",
      };
    }

    if (order.payment_status === "refunded") {
      return {
        success: false,
        error: "This order is already marked as refunded.",
      };
    }

    const auditNote = `Payment status updated to 'refunded' by owner (${admin.fullName || admin.email}). Recorded manual Razorpay refund. ${refundReason ? `Reason: ${refundReason.trim()}` : ""}`.trim();

    // Update payment_status to 'refunded', and transition status to 'refunded' if allowed
    const nextStatus = canTransitionStatus(order.status as OrderStatus, "refunded")
      ? "refunded"
      : order.status;

    const { error: updateErr } = await adminSupabase
      .from("orders")
      .update({
        status: nextStatus,
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      return { success: false, error: "Failed to update refund status in database." };
    }

    // Insert audit trail entry
    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: nextStatus,
      note: auditNote,
      created_by: admin.id,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderNumber}`);
    return { success: true, orderNumber };
  } catch (error) {
    console.error("Error in markOrderAsRefundedAction:", error);
    const msg = error instanceof Error ? error.message : "Failed to record refund.";
    if (msg.includes("FORBIDDEN") || msg.includes("INSUFFICIENT")) {
      return {
        success: false,
        error: "Permission denied: Only store owners can mark orders as refunded or manage financial overrides.",
      };
    }
    return { success: false, error: msg };
  }
}

/**
 * Cancels an order from the admin panel on the customer's behalf.
 * - Allowed for both OWNER and STAFF roles ('manage_orders' permission).
 * - Restores stock quantities and enforces the EXACT same cancellation logic
 *   as the customer-facing cancellation flow from Phase 4A (executeOrderCancellation).
 * - Requires a cancellation reason note.
 * - Cannot cancel once order is shipped or delivered.
 */
export async function cancelAdminOrderAction(
  orderNumber: string,
  reason: string
): Promise<OrderActionResult> {
  try {
    const admin = await requireAdmin("manage_orders");

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: "A cancellation reason note is required.",
      };
    }

    const adminSupabase = createAdminClient();

    // Reuses the identical stock restoration and status update logic from Phase 4A
    const result = await executeOrderCancellation(adminSupabase, {
      orderNumber,
      userId: admin.id,
      reason: reason.trim(),
      isAdmin: true,
    });

    if (result.success) {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderNumber}`);
      revalidatePath(`/account/orders/${orderNumber}`);
      revalidatePath("/account/orders");
    }

    return result;
  } catch (error) {
    console.error("Error in cancelAdminOrderAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order.",
    };
  }
}

/**
 * Resends the order confirmation email to the customer.
 * - Allowed for both OWNER and STAFF roles.
 * - Reuses existing email templates and sending logic from Phase 3D.
 */
export async function resendOrderConfirmationEmailAction(
  orderNumber: string
): Promise<OrderActionResult> {
  try {
    const admin = await requireAdmin("manage_orders");
    const adminSupabase = createAdminClient();

    // 1. Fetch order
    const { data: order, error: orderErr } = await adminSupabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: "Order not found." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipAddr = (order.shipping_address as any) || {};
    const recipientEmail = shipAddr.email;

    if (!recipientEmail) {
      return { success: false, error: "Customer email is missing on this order." };
    }

    // 2. Fetch order items
    const { data: items } = await adminSupabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const emailItems = (items || []).map((it) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variantDetails = (it.variant_details_snapshot as any) || {};
      return {
        title: it.product_name_snapshot,
        size: variantDetails.size || "Standard",
        color: variantDetails.color || "Default",
        quantity: it.quantity,
        unitPrice: Number(it.unit_price) || 0,
        lineSubtotal: Number(it.subtotal) || 0,
      };
    });

    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const orderViewUrl = `${appUrl}/account/orders/${order.order_number}`;

    const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 3. Dispatch email using Phase 3D transactional template
    const emailResult = await sendTransactionalEmail({
      to: recipientEmail,
      subject: `Order Confirmation: ${order.order_number} - Velaash`,
      orderNumber: order.order_number,
      react: React.createElement(OrderConfirmationEmail, {
        orderNumber: order.order_number,
        customerName: shipAddr.fullName || "Customer",
        orderDate: formattedDate,
        paymentMethod: order.payment_method,
        paymentStatus: (order.payment_status === "paid" ? "paid" : "pending") as "pending" | "paid",
        items: emailItems,
        subtotal: Number(order.subtotal) || 0,
        discountAmount: Number(order.discount_amount) || 0,
        couponCode: order.coupon_code || undefined,
        shippingCharge: Number(order.shipping_charge) || 0,
        codHandlingFee: 0,
        totalAmount: Number(order.total_amount) || 0,
        shippingAddress: shipAddr,
        orderViewUrl,
        accountCreatedFromGuest: false,
      }),
    });

    // 4. Record audit note
    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: order.status,
      note: `Confirmation email resent to ${recipientEmail} by ${admin.fullName || "Admin"} (Result: ${emailResult.success ? "Sent" : "Failed"})`,
      created_by: admin.id,
    });

    return {
      success: emailResult.success,
      orderNumber,
      error: emailResult.success ? undefined : "Email service returned an error.",
    };
  } catch (error) {
    console.error("Error in resendOrderConfirmationEmailAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resend confirmation email.",
    };
  }
}
