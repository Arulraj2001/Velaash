"use server";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import type { AdminUserSession } from "@/features/auth/types";
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
import { executeOrderCancellation } from "@/features/orders/cancel-order";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { OrderConfirmationEmail } from "@/features/checkout/emails/order-confirmation-email";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";
import { getSiteSettings } from "@/features/settings";
import { revalidateProductCatalog } from "@/lib/revalidation";

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

    if (targetStatus === "cancelled" || targetStatus === "refunded") {
      return {
        success: false,
        error: "Use the dedicated cancellation or owner-only refund action for this transition.",
      };
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("id, order_number, status, notes, payment_method, payment_status")
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

    if (
      order.payment_method === "razorpay" &&
      order.payment_status !== "paid" &&
      ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"].includes(targetStatus)
    ) {
      return {
        success: false,
        error: "Online orders must be paid before fulfillment can proceed.",
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
    //    When shipping, also write to the dedicated columns so they are directly
    //    queryable without parsing the notes JSON metadata blob.
    const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
      status: targetStatus,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === "shipped") {
      updatePayload.tracking_number = trackingNumber?.trim() ?? null;
      updatePayload.courier_name = courierName?.trim() ?? null;
    }

    // Auto-reconcile payment_status for COD orders upon successful delivery
    if (
      targetStatus === "delivered" &&
      order.payment_method === "cod" &&
      order.payment_status === "pending"
    ) {
      updatePayload.payment_status = "paid";
      auditNote = `${auditNote} (COD payment auto-reconciled to 'paid')`.trim();
    }

    const { data: updatedOrder, error: updateErr } = await adminSupabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id)
      .eq("status", currentStatus)
      .eq("payment_status", order.payment_status)
      .select("id")
      .maybeSingle();

    if (updateErr || !updatedOrder) {
      console.error("Failed to update order status:", updateErr);
      return {
        success: false,
        error: "Order status changed while this update was in progress. Refresh and try again.",
      };
    }

    // 5. Insert audit log record
    const isValidAdminUuid =
      Boolean(admin.id) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(admin.id);

    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: targetStatus,
      note: auditNote,
      created_by: isValidAdminUuid ? admin.id : null,
    });

    // 6. Revalidate routes
    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderNumber}`);
      revalidatePath(`/account/orders/${orderNumber}`);
      revalidatePath("/account/orders");
    } catch {
      // Safe no-op outside Next.js request context (e.g. CLI test suites)
    }

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

    if (targetStatus !== "confirmed" && targetStatus !== "packed") {
      return {
        success: false,
        error: "Bulk updates are limited to confirmation and packing. Use the order detail for other transitions.",
      };
    }

    const adminSupabase = createAdminClient();

    // Fetch all requested orders
    const { data: orders, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("id, order_number, status, notes, payment_method, payment_status")
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

      if (
        order.payment_method === "razorpay" &&
        order.payment_status !== "paid" &&
        ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"].includes(targetStatus)
      ) {
        skippedCount++;
        continue;
      }

      const { data: updatedOrder, error: updateErr } = await adminSupabase
        .from("orders")
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("status", currentStatus)
        .eq("payment_status", order.payment_status)
        .select("id")
        .maybeSingle();

      if (updateErr || !updatedOrder) {
        skippedCount++;
        continue;
      }

      const isValidAdminUuid =
        Boolean(admin.id) &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(admin.id);

      await adminSupabase.from("order_status_history").insert({
        order_id: order.id,
        status: targetStatus,
        note: `Bulk status update to '${targetStatus}' by ${admin.fullName || "Admin"}`,
        created_by: isValidAdminUuid ? admin.id : null,
      });

      updatedCount++;
    }

    try {
      revalidatePath("/admin/orders");
      revalidatePath("/admin");
      revalidatePath("/account/orders");
      for (const num of orderNumbers) {
        revalidatePath(`/admin/orders/${num}`);
        revalidatePath(`/account/orders/${num}`);
      }
    } catch {
      // Safe no-op outside Next.js request context (e.g. CLI test suites)
    }

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

    if (order.payment_status !== "paid") {
      return {
        success: false,
        error: "An order must have a completed payment before it can be marked as refunded.",
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
 *   as the customer-facing cancellation flow (executeOrderCancellation).
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

    // Check if order has an active Shiprocket order ID
    const { data: existingOrder } = await adminSupabase
      .from("orders")
      .select("id, shiprocket_order_id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (existingOrder?.shiprocket_order_id) {
      try {
        const { cancelShiprocketOrder } = await import("@/lib/shiprocket");
        await cancelShiprocketOrder(existingOrder.shiprocket_order_id);
      } catch (srErr) {
        console.warn("[Shiprocket] Non-blocking cancellation error:", srErr);
      }
    }

    // Reuses the identical stock restoration and status update logic
    const result = await executeOrderCancellation(adminSupabase, {
      orderNumber,
      userId: admin.id,
      reason: reason.trim(),
      isAdmin: true,
    });

    if (result.success) {
      revalidatePath("/admin/orders");
      revalidatePath("/admin");
      revalidatePath(`/admin/orders/${orderNumber}`);
      revalidatePath(`/account/orders/${orderNumber}`);
      revalidatePath("/account/orders");

      // Revalidate product catalog and affected PDPs for restored inventory
      try {
        const { data: orderData } = await adminSupabase
          .from("orders")
          .select("order_items (products (slug))")
          .eq("order_number", orderNumber)
          .maybeSingle();

        const slugs: string[] = [];
        if (orderData?.order_items) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const item of orderData.order_items as any[]) {
            if (item.products?.slug) {
              slugs.push(item.products.slug);
            }
          }
        }
        revalidateProductCatalog(slugs);
      } catch {
        revalidateProductCatalog();
      }
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
 * - Reuses existing email templates and sending logic.
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

    const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
    const { storeProfile } = await getSiteSettings();
    const orderViewUrl = `${appUrl}/account/orders/${order.order_number}`;

    const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 3. Dispatch email using transactional template
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
        supportEmail: storeProfile.email,
      }),
    });

    // 4. Record audit note
    const isValidAdminUuid =
      Boolean(admin.id) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(admin.id);

    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: order.status,
      note: `Confirmation email resent to ${recipientEmail} by ${admin.fullName || "Admin"} (Result: ${emailResult.success ? "Sent" : "Failed"})`,
      created_by: isValidAdminUuid ? admin.id : null,
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

/**
 * Pushes a packed Velaash order to Shiprocket for dispatch.
 * - Allowed for OWNER and STAFF with 'manage_orders' permission.
 * - Only valid for orders in 'packed' status (state machine enforced).
 * - On success: transitions order to 'shipped', records Shiprocket order ID + AWB in notes,
 *   and creates an audit trail entry. Manual tracking entry remains available as fallback.
 * - On failure: returns a clear error without mutating order state.
 */
export async function pushToShiprocketAction(
  orderNumber: string,
  options?: { adminSessionOverride?: AdminUserSession }
): Promise<OrderActionResult & { awbCode?: string | null; shiprocketOrderId?: string | null }> {
  try {
    const admin = options?.adminSessionOverride ?? (await requireAdmin("manage_orders"));
    const adminSupabase = createAdminClient();

    // 1. Fetch full order with items
    const { data: order, error: orderErr } = await adminSupabase
      .from("orders")
      .select("id, order_number, status, notes, payment_method, total_amount, shipping_address, created_at")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status !== "packed") {
      return {
        success: false,
        error: `Only 'packed' orders can be pushed to Shiprocket. Current status: '${order.status}'.`,
      };
    }

    // 2. Fetch order items
    const { data: items, error: itemsErr } = await adminSupabase
      .from("order_items")
      .select("product_name_snapshot, quantity, unit_price, variant_details_snapshot")
      .eq("order_id", order.id);

    if (itemsErr || !items || items.length === 0) {
      return { success: false, error: "Failed to retrieve order items." };
    }

    // 3. Fetch Shiprocket pickup settings from site_settings
    let pickupLocation = "Primary"; // Default pickup location name in Shiprocket dashboard
    let defaultWeightKg = 0.5;
    try {
      const { data: srRow } = await adminSupabase
        .from("site_settings")
        .select("value")
        .eq("key", "shiprocket_settings")
        .maybeSingle();

      if (srRow?.value) {
        const srSettings = srRow.value as {
          logistics_mode?: string;
          pickup_location_name?: string;
          default_weight_kg?: number;
        };

        // Safety guard: block Shiprocket API if manual mode is active
        const logisticsMode = srSettings.logistics_mode ?? "manual";
        if (logisticsMode !== "shiprocket") {
          return {
            success: false,
            error:
              "Shiprocket is currently disabled. Switch to 'Shiprocket Mode' in Admin → Settings → Logistics to enable API dispatch.",
          };
        }

        pickupLocation = srSettings.pickup_location_name ?? pickupLocation;
        defaultWeightKg = srSettings.default_weight_kg ?? defaultWeightKg;
      } else {
        // No settings row found — default is manual, block the call
        return {
          success: false,
          error:
            "Logistics mode is not configured. Please set it to 'Shiprocket Mode' in Admin → Settings → Logistics.",
        };
      }
    } catch {
      // Non-critical — use defaults
    }

    // 4. Build Shiprocket payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = (order.shipping_address as any) || {};

    const { createShiprocketOrder } = await import("@/lib/shiprocket");

    const srResult = await createShiprocketOrder({
      orderNumber: order.order_number,
      orderDate: order.created_at,
      pickupLocation,
      customerName: addr.fullName || "Customer",
      customerEmail: addr.email || "",
      customerPhone: addr.phone || "",
      shippingAddress: {
        fullName: addr.fullName || "",
        addressLine1: addr.addressLine1 || "",
        addressLine2: addr.addressLine2 || null,
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || "",
        country: "India",
        phone: addr.phone || "",
      },
      paymentMethod: order.payment_method === "cod" ? "COD" : "Prepaid",
      totalAmount: Number(order.total_amount) || 0,
      items: items.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = (item.variant_details_snapshot as any) || {};
        return {
          name: item.product_name_snapshot,
          sku: `${orderNumber}-${details.size || "OS"}-${details.color || "DEFAULT"}`.substring(0, 40),
          units: item.quantity,
          sellingPrice: Number(item.unit_price) || 0,
        };
      }),
      weightKg: defaultWeightKg,
    });

    // 5. Record Shiprocket IDs and AWB in BOTH dedicated columns AND notes metadata blob
    //    - Dedicated columns: queryable by extractTrackingInfo + customer-facing queries
    //    - Notes blob: legacy fallback compatibility for old orders / data exports
    const updatedNotes = serializeOrderNotes(order.notes, {
      trackingNumber: srResult.awbCode ?? undefined,
      courierName: srResult.courierName ?? undefined,
    });

    // 6. Transition order to 'shipped' status — write all four Shiprocket fields
    const { error: updateErr } = await adminSupabase
      .from("orders")
      .update({
        status: "shipped",
        notes: updatedNotes,
        // Dedicated tracking columns (these are what extractTrackingInfo reads first)
        tracking_number: srResult.awbCode ?? null,
        courier_name: srResult.courierName ?? null,
        // Shiprocket-specific IDs for amendments/cancellations
        shiprocket_order_id: String(srResult.shiprocketOrderId),
        shiprocket_shipment_id: String(srResult.shipmentId),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      return {
        success: false,
        error: "Shiprocket order created but failed to update local status. Please mark as shipped manually.",
      };
    }

    // 7. Audit trail
    const auditNote = [
      `Order pushed to Shiprocket by ${admin.fullName || admin.email}.`,
      `Shiprocket Order ID: ${srResult.shiprocketOrderId}`,
      srResult.awbCode ? `AWB: ${srResult.awbCode}` : null,
      srResult.courierName ? `Courier: ${srResult.courierName}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const isValidUuid =
      Boolean(admin.id) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(admin.id);

    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: "shipped",
      note: auditNote,
      created_by: isValidUuid ? admin.id : null,
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderNumber}`);
      revalidatePath(`/account/orders/${orderNumber}`);
    } catch {
      // Safe no-op outside Next.js request context (e.g. CLI test suites)
    }

    return {
      success: true,
      orderNumber,
      awbCode: srResult.awbCode ?? null,
      shiprocketOrderId: String(srResult.shiprocketOrderId),
    };
  } catch (error) {
    console.error("Error in pushToShiprocketAction:", error);
    Sentry.captureException(error, {
      tags: { service: "shiprocket_push", orderNumber },
    });
    const msg = error instanceof Error ? error.message : "Failed to push order to Shiprocket.";
    if (msg.includes("FORBIDDEN")) {
      return { success: false, error: "Access denied: insufficient permissions." };
    }
    return { success: false, error: msg };
  }
}
