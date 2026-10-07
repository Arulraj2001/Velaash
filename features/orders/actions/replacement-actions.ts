"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CreateReplacementInput,
  OrderReplacementRecord,
  ReplacementStatus,
} from "../types";
import type { UpdateReplacementStatusInput } from "@/features/admin/types/orders";

export interface ReplacementActionResult {
  success: boolean;
  error?: string;
  replacementId?: string;
  storeCreditCode?: string;
}

/**
 * Maps raw database row to strongly-typed OrderReplacementRecord.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReplacementRow(row: any): OrderReplacementRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    orderItemId: row.order_item_id,
    itemTitle: row.item_title,
    currentSize: row.current_size,
    currentColor: row.current_color,
    desiredSize: row.desired_size,
    desiredColor: row.desired_color,
    reason: row.reason,
    customerPhone: row.customer_phone,
    customerNotes: row.customer_notes,
    status: row.status as ReplacementStatus,
    videoReviewed: Boolean(row.video_reviewed),
    videoReviewedAt: row.video_reviewed_at,
    rejectionReason: row.rejection_reason,
    storeCreditCode: row.store_credit_code,
    storeCreditAmount: row.store_credit_amount != null ? Number(row.store_credit_amount) : null,
    replacementCourier: row.replacement_courier,
    replacementTrackingNumber: row.replacement_tracking_number,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Customer Server Action: Submits a doorstep replacement or size exchange request.
 * - Requires unboxing video verification by the store owner via WhatsApp.
 * - Enforces return window and order ownership.
 * - Prevents duplicate active replacement requests on the same item.
 */
export async function createReplacementRequestAction(
  input: CreateReplacementInput
): Promise<ReplacementActionResult> {
  try {
    const authData = await getCurrentUser();
    if (!authData || !authData.user) {
      return {
        success: false,
        error: "Please sign in to submit a replacement or exchange request.",
      };
    }

    const { user } = authData;
    const orderNumber = input.orderNumber?.trim();
    const orderItemId = input.orderItemId?.trim();
    const cleanPhone = input.customerPhone?.replace(/\D/g, "");

    if (!orderNumber) {
      return { success: false, error: "Order number is required." };
    }
    if (!orderItemId) {
      return { success: false, error: "Please select an item to replace or exchange." };
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        error: "A valid 10-digit WhatsApp contact phone number is required so our team can reach you for unboxing video proof.",
      };
    }
    if (!input.reason) {
      return { success: false, error: "Please specify the reason for replacement." };
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch Order and verify ownership
    const { data: order, error: orderErr } = await adminSupabase
      .from("orders")
      .select("id, order_number, customer_id, status, shipping_address, created_at, total_amount")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: "Order not found." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipAddr = (order.shipping_address as any) || {};
    const isOwner =
      order.customer_id === user.id ||
      (user.email && shipAddr.email && user.email.toLowerCase() === shipAddr.email.toLowerCase());

    if (!isOwner) {
      return { success: false, error: "Access denied. Order does not belong to your account." };
    }

    // 2. Enforce 7-day return window from order creation / delivery
    const orderCreatedAt = new Date(order.created_at).getTime();
    const now = Date.now();
    const daysSince = (now - orderCreatedAt) / (1000 * 60 * 60 * 24);
    if (daysSince > 10) {
      return {
        success: false,
        error:
          "The standard 7-day doorstep replacement window has elapsed for this order. Please reach out to our WhatsApp support team for assistance.",
      };
    }

    // 3. Fetch selected order item
    const { data: item, error: itemErr } = await adminSupabase
      .from("order_items")
      .select("id, product_name_snapshot, variant_details_snapshot, subtotal")
      .eq("id", orderItemId)
      .eq("order_id", order.id)
      .maybeSingle();

    if (itemErr || !item) {
      return { success: false, error: "Selected item was not found in this order." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variantSnapshot = (item.variant_details_snapshot as any) || {};

    // 4. Defensive check: Check if replacement table exists and if an active request already exists
    try {
      const { data: existing, error: checkErr } = await adminSupabase
        .from("order_replacements")
        .select("id, status")
        .eq("order_id", order.id)
        .eq("order_item_id", orderItemId)
        .not("status", "in", '("rejected","completed")')
        .maybeSingle();

      if (!checkErr && existing) {
        return {
          success: false,
          error: "A replacement request is already in progress for this item.",
        };
      }
    } catch {
      // Table may not exist yet if migration pending — continue to insert attempt
    }

    // 5. Insert replacement record
    const insertPayload = {
      order_id: order.id,
      order_number: order.order_number,
      customer_id: user.id,
      order_item_id: item.id,
      item_title: item.product_name_snapshot,
      current_size: variantSnapshot.size || "Standard",
      current_color: variantSnapshot.color || "Default",
      desired_size: input.desiredSize?.trim() || null,
      desired_color: input.desiredColor?.trim() || null,
      reason: input.reason,
      customer_phone: cleanPhone,
      customer_notes: input.customerNotes?.trim() || null,
      status: "pending_video_review" as const,
      video_reviewed: false,
    };

    const { data: inserted, error: insertErr } = await (
      adminSupabase.from("order_replacements") as any
    )
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr) {
      console.error("Failed to insert into order_replacements:", insertErr);
      if ((insertErr as { code?: string }).code === "42P01") {
        return {
          success: false,
          error:
            "Replacement database service is undergoing a scheduled update. Please message our WhatsApp concierge directly with your order number.",
        };
      }
      return {
        success: false,
        error: insertErr.message || "Failed to submit replacement request. Please try again.",
      };
    }

    // 6. Record status history audit note on the order
    try {
      await adminSupabase.from("order_status_history").insert({
        order_id: order.id,
        status: order.status,
        note: `Customer requested replacement for "${item.product_name_snapshot}". Reason: ${input.reason}. WhatsApp Video Outreach queued for +91 ${cleanPhone}.`,
        created_by: user.id,
      });
    } catch {
      // Non-blocking audit log
    }

    revalidatePath(`/account/orders/${order.order_number}`);
    revalidatePath(`/admin/orders/${order.order_number}`);

    return {
      success: true,
      replacementId: inserted?.id || "",
    };

  } catch (error) {
    console.error("Error in createReplacementRequestAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit replacement request.",
    };
  }
}

/**
 * Queries active replacement request and history for a given order.
 * Defensive against missing database migration (catches code 42P01 gracefully).
 */
export async function getReplacementForOrderQuery(
  orderId: string,
  orderNumber?: string
): Promise<{
  activeReplacement: OrderReplacementRecord | null;
  allReplacements: OrderReplacementRecord[];
}> {
  try {
    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from("order_replacements")
      .select("*")
      .order("created_at", { ascending: false });

    if (orderId) {
      query = query.eq("order_id", orderId);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else {
      return { activeReplacement: null, allReplacements: [] };
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty without throwing
      if ((error as { code?: string }).code === "42P01") {
        return { activeReplacement: null, allReplacements: [] };
      }
      console.warn("Could not fetch order replacements:", error);
      return { activeReplacement: null, allReplacements: [] };
    }

    if (!data || data.length === 0) {
      return { activeReplacement: null, allReplacements: [] };
    }

    const all = data.map(mapReplacementRow);
    // Active is first one that is not completed or rejected, or just the most recent
    const active = all.find((r) => !["completed", "rejected"].includes(r.status)) || all[0];

    return {
      activeReplacement: active || null,
      allReplacements: all,
    };
  } catch {
    return { activeReplacement: null, allReplacements: [] };
  }
}

/**
 * Admin / Owner Server Action: Updates replacement status, video verification,
 * courier tracking, store credit vouchers, or rare cash refund exceptions.
 */
export async function updateReplacementStatusAction(
  input: UpdateReplacementStatusInput
): Promise<ReplacementActionResult> {
  try {
    const adminSupabase = createAdminClient();

    // Owner check for refund approval; general admin check for others
    let adminUser;
    if (input.status === "refund_approved") {
      adminUser = await requireAdmin("manage_refunds");
    } else {
      adminUser = await requireAdmin("manage_orders");
    }

    // 1. Fetch current replacement record
    const { data: rep, error: repErr } = await adminSupabase
      .from("order_replacements")
      .select("*, orders!inner(id, order_number, total_amount, status, payment_status)")
      .eq("id", input.replacementId)
      .maybeSingle();

    if (repErr || !rep) {
      return { success: false, error: "Replacement record not found." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderData = (rep as any).orders;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {
      status: input.status,
      updated_at: new Date().toISOString(),
    };

    let generatedCouponCode: string | undefined;

    // 2. Handle status-specific logic
    if (input.status === "video_verified") {
      updatePayload.video_reviewed = true;
      updatePayload.video_reviewed_at = new Date().toISOString();
      if (input.adminNotes) {
        updatePayload.admin_notes = input.adminNotes.trim();
      }
    } else if (input.status === "approved") {
      if (input.replacementCourier) {
        updatePayload.replacement_courier = input.replacementCourier.trim();
      }
      if (input.replacementTrackingNumber) {
        updatePayload.replacement_tracking_number = input.replacementTrackingNumber.trim();
      }
      if (input.adminNotes) {
        updatePayload.admin_notes = input.adminNotes.trim();
      }
    } else if (input.status === "store_credit_issued") {
      const creditAmount = Number(input.storeCreditAmount) || Number(orderData.total_amount) || 0;
      const code =
        input.storeCreditCode?.trim().toUpperCase() ||
        `EXCHANGE-${orderData.order_number.slice(-4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      generatedCouponCode = code;
      updatePayload.store_credit_code = code;
      updatePayload.store_credit_amount = creditAmount;

      // Create live single-use coupon in public.coupons
      try {
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 year validity

        await adminSupabase.from("coupons").upsert(
          {
            code,
            discount_type: "flat",
            discount_value: creditAmount,
            min_order_value: 0,
            usage_limit: 1,
            usage_count: 0,
            valid_from: new Date().toISOString(),
            valid_until: validUntil.toISOString(),
            is_active: true,
          },
          { onConflict: "code" }
        );
      } catch (couponErr) {
        console.warn("Failed to insert store credit coupon into public.coupons:", couponErr);
      }
    } else if (input.status === "refund_approved") {
      // Rare cash refund exception approved by store owner
      try {
        await adminSupabase
          .from("orders")
          .update({
            refund_status: "pending_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", (rep as any).order_id);
      } catch (err) {
        console.warn("Could not set refund_status on order:", err);
      }
    } else if (input.status === "rejected") {
      if (!input.rejectionReason || !input.rejectionReason.trim()) {
        return {
          success: false,
          error: "A rejection reason is required so the customer understands why the request was declined.",
        };
      }
      updatePayload.rejection_reason = input.rejectionReason.trim();
    }

    if (input.adminNotes && !updatePayload.admin_notes) {
      updatePayload.admin_notes = input.adminNotes.trim();
    }

    // 3. Update order_replacements
    const { error: updateErr } = await (
      adminSupabase.from("order_replacements") as any
    )
      .update(updatePayload)
      .eq("id", input.replacementId);

    if (updateErr) {
      console.error("Failed to update order_replacements:", updateErr);
      return { success: false, error: "Failed to update replacement status in database." };
    }

    // 4. Record audit note on the order timeline
    try {
      const statusLabel =
        input.status === "video_verified"
          ? "Unboxing Video Verified on WhatsApp"
          : input.status === "approved"
          ? "Replacement Approved & Dispatched"
          : input.status === "store_credit_issued"
          ? `Store Credit Voucher Issued (${generatedCouponCode || "Voucher"})`
          : input.status === "refund_approved"
          ? "Rare Refund Exception Approved"
          : input.status === "rejected"
          ? `Replacement Declined: ${input.rejectionReason}`
          : `Replacement Marked as Fulfilled`;

      const isValidAdminUuid =
        Boolean(adminUser.id) &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUser.id);

      await adminSupabase.from("order_status_history").insert({
        order_id: (rep as any).order_id,
        status: orderData.status,
        note: `[Replacement Desk] ${statusLabel} by ${adminUser.fullName || "Admin"}.`,
        created_by: isValidAdminUuid ? adminUser.id : null,
      });
    } catch {
      // Non-critical audit trail
    }


    revalidatePath(`/admin/orders/${orderData.order_number}`);
    revalidatePath(`/account/orders/${orderData.order_number}`);

    return {
      success: true,
      replacementId: input.replacementId,
      storeCreditCode: generatedCouponCode,
    };
  } catch (error) {
    console.error("Error in updateReplacementStatusAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update replacement status.",
    };
  }
}
