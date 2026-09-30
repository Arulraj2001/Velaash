"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CouponFormSchema,
  type CouponFormData,
} from "../types/coupons";

export interface CouponActionResult {
  success: boolean;
  error?: string;
  couponId?: string;
  code?: string;
}

/**
 * Revalidates admin coupon management and public cart/checkout surfaces.
 */
function revalidateCouponPaths() {
  revalidatePath("/admin/coupons");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

/**
 * Creates a new discount coupon.
 * - OWNER ONLY ('manage_coupons' permission).
 * - Enforces auto-uppercasing, percentage capping (<=100%), and chronological date validation.
 */
export async function createCouponAction(
  input: CouponFormData
): Promise<CouponActionResult> {
  try {
    await requireAdmin("manage_coupons");

    const parsed = CouponFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid coupon parameters.",
      };
    }

    const data = parsed.data;
    const adminClient = createAdminClient();

    // Check if code is already in use
    const { data: existing } = await adminClient
      .from("coupons")
      .select("id")
      .eq("code", data.code)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `Coupon code '${data.code}' already exists. Please choose a unique code.`,
      };
    }

    const { data: inserted, error: insertErr } = await adminClient
      .from("coupons")
      .insert({
        code: data.code,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        min_order_value: data.minOrderValue || 0,
        max_discount_amount: data.maxDiscountAmount || null,
        usage_limit: data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null,
        valid_from: new Date(data.validFrom).toISOString(),
        valid_until: new Date(data.validUntil).toISOString(),
        is_active: data.isActive,
      })
      .select("id, code")
      .single();

    if (insertErr || !inserted) {
      console.error("Failed to insert coupon:", insertErr);
      return {
        success: false,
        error: "Failed to create coupon in database. Please check all constraints.",
      };
    }

    revalidateCouponPaths();

    return {
      success: true,
      couponId: inserted.id,
      code: inserted.code,
    };
  } catch (error) {
    console.error("Error in createCouponAction:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    if (msg.includes("FORBIDDEN") || msg.includes("INSUFFICIENT")) {
      return { success: false, error: "Access denied: only store owners can manage promotional coupons." };
    }
    return { success: false, error: msg };
  }
}

/**
 * Updates an existing coupon's terms or validity.
 * - OWNER ONLY.
 */
export async function updateCouponAction(
  id: string,
  input: CouponFormData
): Promise<CouponActionResult> {
  try {
    await requireAdmin("manage_coupons");

    const parsed = CouponFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid coupon parameters.",
      };
    }

    const data = parsed.data;
    const adminClient = createAdminClient();

    // Check code uniqueness excluding this coupon
    const { data: conflict } = await adminClient
      .from("coupons")
      .select("id")
      .eq("code", data.code)
      .neq("id", id)
      .maybeSingle();

    if (conflict) {
      return {
        success: false,
        error: `Another coupon is already using code '${data.code}'. Code must be unique.`,
      };
    }

    const { error: updateErr } = await adminClient
      .from("coupons")
      .update({
        code: data.code,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        min_order_value: data.minOrderValue || 0,
        max_discount_amount: data.maxDiscountAmount || null,
        usage_limit: data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null,
        valid_from: new Date(data.validFrom).toISOString(),
        valid_until: new Date(data.validUntil).toISOString(),
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("Failed to update coupon:", updateErr);
      return {
        success: false,
        error: "Failed to update coupon record in database.",
      };
    }

    revalidateCouponPaths();

    return {
      success: true,
      couponId: id,
      code: data.code,
    };
  } catch (error) {
    console.error("Error in updateCouponAction:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    if (msg.includes("FORBIDDEN") || msg.includes("INSUFFICIENT")) {
      return { success: false, error: "Access denied: only store owners can manage promotional coupons." };
    }
    return { success: false, error: msg };
  }
}

/**
 * One-click active/inactive toggle to quickly pause/resume a promotion.
 * - OWNER ONLY.
 */
export async function toggleCouponStatusAction(
  id: string,
  isActive: boolean
): Promise<CouponActionResult> {
  try {
    await requireAdmin("manage_coupons");

    const adminClient = createAdminClient();

    const { error: updateErr } = await adminClient
      .from("coupons")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return { success: false, error: "Failed to toggle coupon status." };
    }

    revalidateCouponPaths();

    return { success: true, couponId: id };
  } catch (error) {
    console.error("Error in toggleCouponStatusAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle status.",
    };
  }
}

/**
 * Permanently deletes a coupon code.
 * - OWNER ONLY.
 * - Note on Data Integrity:
 *   Historical orders store coupon_code and discount_amount as frozen snapshots,
 *   so deleting a coupon has zero impact on past orders or historical financial reports.
 */
export async function deleteCouponAction(
  id: string
): Promise<CouponActionResult> {
  try {
    await requireAdmin("manage_coupons");

    const adminClient = createAdminClient();

    const { data: coupon, error: fetchErr } = await adminClient
      .from("coupons")
      .select("id, code, usage_count")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !coupon) {
      return { success: false, error: "Coupon not found." };
    }

    const { error: deleteErr } = await adminClient
      .from("coupons")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      console.error("Failed to delete coupon:", deleteErr);
      return { success: false, error: "Database error while deleting coupon." };
    }

    revalidateCouponPaths();

    return {
      success: true,
      couponId: id,
      code: coupon.code,
    };
  } catch (error) {
    console.error("Error in deleteCouponAction:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete coupon.";
    if (msg.includes("FORBIDDEN") || msg.includes("INSUFFICIENT")) {
      return { success: false, error: "Access denied: only store owners can delete coupons." };
    }
    return { success: false, error: msg };
  }
}
