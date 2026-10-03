import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";

export interface ActiveCouponOption {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  validUntil: string;
}

/**
 * Retrieves only currently active, non-expired coupons for the Promo Popup dropdown selector.
 * - Enforces Owner-only permission ('manage_settings').
 * - Filters for is_active = true and current time within valid_from and valid_until.
 */
export async function getActiveCoupons(): Promise<ActiveCouponOption[]> {
  await requireAdmin("manage_settings");

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data: coupons, error } = await adminClient
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, min_order_value, max_discount_amount, valid_until"
    )
    .eq("is_active", true)
    .lte("valid_from", now)
    .gte("valid_until", now)
    .order("code", { ascending: true });

  if (error || !coupons) {
    console.error("Error querying active coupons for promo popup:", error);
    return [];
  }

  return coupons.map((c) => ({
    id: c.id,
    code: c.code.toUpperCase(),
    discountType: c.discount_type === "percentage" ? "percentage" : "flat",
    discountValue: c.discount_value,
    minOrderValue: c.min_order_value,
    maxDiscountAmount: c.max_discount_amount,
    validUntil: c.valid_until,
  }));
}
