"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CancelOrderResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
}

/**
 * Core order cancellation logic.
 * Restores variant stock quantities, updates order status to 'cancelled',
 * and records an entry into order_status_history.
 * Enforces ownership and prohibits cancellation if order is shipped/delivered.
 */
export async function executeOrderCancellation(
  adminSupabase: ReturnType<typeof createAdminClient>,
  params: {
    orderNumber: string;
    userId: string;
    userEmail?: string | null;
    reason?: string;
    isAdmin?: boolean;
  }
): Promise<CancelOrderResult> {
  const { orderNumber, userId, userEmail, reason, isAdmin } = params;

  // 1. Fetch the target order
  const { data: order, error: orderErr } = await adminSupabase
    .from("orders")
    .select("id, order_number, customer_id, status, shipping_address")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderErr || !order) {
    return {
      success: false,
      error: "Order not found.",
    };
  }

  // 2. Strict ownership check (bypassed if called by authenticated admin with manage_orders)
  if (!isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipAddr = (order.shipping_address as any) || {};
    const isOwner =
      order.customer_id === userId ||
      (userEmail && shipAddr.email && userEmail.toLowerCase() === shipAddr.email.toLowerCase());

    if (!isOwner) {
      // Do not reveal that the order exists to unauthorized parties (return 404 equivalent)
      return {
        success: false,
        error: "Order not found.",
      };
    }
  }

  // 3. Status eligibility check
  // Cannot cancel if already cancelled, refunded, shipped, out_for_delivery, delivered
  if (["shipped", "out_for_delivery", "delivered"].includes(order.status)) {
    return {
      success: false,
      error: "This order has already been dispatched or delivered and cannot be cancelled online. Please contact our support team.",
    };
  }

  if (["cancelled", "refunded"].includes(order.status)) {
    return {
      success: false,
      error: "This order is already cancelled or refunded.",
    };
  }

  const cancellableStatuses = ["pending", "confirmed", "packed"];
  if (!cancellableStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Order in '${order.status}' status cannot be cancelled.`,
    };
  }

  // 4. Restore Inventory Stock
  // Query all items for this order and release stock back to variants
  const { data: items } = await adminSupabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", order.id);

  if (items && items.length > 0) {
    for (const item of items) {
      if (item.variant_id) {
        const { data: variant } = await adminSupabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single();

        if (variant) {
          await adminSupabase
            .from("product_variants")
            .update({
              stock_quantity: variant.stock_quantity + item.quantity,
            })
            .eq("id", item.variant_id);
        }
      }
    }
  }

  // 5. Update Order Status in Database
  const cancelNote = reason?.trim()
    ? (isAdmin ? `Cancelled by admin: ${reason.trim()}` : `Cancelled by customer: ${reason.trim()}`)
    : (isAdmin ? "Cancelled by admin" : "Cancelled by customer via Account Dashboard");

  const { error: updateErr } = await adminSupabase
    .from("orders")
    .update({
      status: "cancelled",
      cancel_reason: cancelNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("Failed to update order status to cancelled:", updateErr);
    return {
      success: false,
      error: "Failed to update order status. Please try again.",
    };
  }

  // 6. Insert Audit Trail Record into order_status_history
  const isValidUuid =
    Boolean(userId) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  await adminSupabase.from("order_status_history").insert({
    order_id: order.id,
    status: "cancelled",
    note: cancelNote,
    created_by: isValidUuid ? userId : null,
  });

  return {
    success: true,
    orderNumber,
  };
}

/**
 * Server Action for an authenticated customer to cancel their own order.
 * - Enforces authentication
 * - Delegates to executeOrderCancellation
 * - Revalidates customer account paths
 */
export async function cancelCustomerOrderAction(
  orderNumber: string,
  reason?: string
): Promise<CancelOrderResult> {
  try {
    // 1. Authenticate user
    const authData = await getCurrentUser();
    if (!authData || !authData.user) {
      return {
        success: false,
        error: "Please sign in to cancel your order.",
      };
    }

    const { user } = authData;

    let adminSupabase: ReturnType<typeof createAdminClient>;
    try {
      adminSupabase = createAdminClient();
    } catch {
      return {
        success: false,
        error: "Server database configuration unavailable.",
      };
    }

    const result = await executeOrderCancellation(adminSupabase, {
      orderNumber,
      userId: user.id,
      userEmail: user.email,
      reason,
    });

    if (result.success) {
      // Revalidate routes
      revalidatePath("/account");
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderNumber}`);
    }

    return result;
  } catch (err) {
    console.error("Unexpected error in cancelCustomerOrderAction:", err);
    return {
      success: false,
      error: "An unexpected error occurred while cancelling your order.",
    };
  }
}
