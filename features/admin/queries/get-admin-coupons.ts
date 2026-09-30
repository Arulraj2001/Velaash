import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import type { AdminCoupon, CouponDiscountType } from "../types/coupons";
import { getCouponComputedStatus } from "../types/coupons";

/**
 * Retrieves all coupons for the owner coupon management table.
 * - OWNER ONLY ('manage_coupons' permission).
 * - Enforces zero access for staff members at the server query boundary.
 * - Counts linked orders for usage tracking and deletion safeguards.
 */
export async function getAdminCoupons(): Promise<AdminCoupon[]> {
  // STRICT OWNER ENFORCEMENT: Staff members are denied access
  await requireAdmin("manage_coupons");

  const adminClient = createAdminClient();

  // 1. Fetch all coupon records
  const { data: coupons, error: couponErr } = await adminClient
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (couponErr || !coupons) {
    console.error("Error querying coupons:", couponErr);
    return [];
  }

  // 2. Fetch order counts per coupon code from historical orders
  const { data: orderRows } = await adminClient
    .from("orders")
    .select("coupon_code")
    .not("coupon_code", "is", null);

  const orderCountMap = new Map<string, number>();
  if (orderRows) {
    for (const row of orderRows) {
      if (row.coupon_code) {
        const codeKey = row.coupon_code.trim().toUpperCase();
        orderCountMap.set(codeKey, (orderCountMap.get(codeKey) || 0) + 1);
      }
    }
  }

  const now = new Date();

  // 3. Map to AdminCoupon domain model
  return coupons.map((c) => {
    const code = c.code.toUpperCase();
    const ordersCount = orderCountMap.get(code) || 0;
    const usageCount = Math.max(c.usage_count || 0, ordersCount);

    const computedStatus = getCouponComputedStatus(
      {
        isActive: c.is_active,
        validFrom: c.valid_from,
        validUntil: c.valid_until,
      },
      now
    );

    return {
      id: c.id,
      code,
      discountType: c.discount_type as CouponDiscountType,
      discountValue: Number(c.discount_value) || 0,
      minOrderValue: Number(c.min_order_value) || 0,
      maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
      usageLimit: c.usage_limit ? Number(c.usage_limit) : null,
      usageCount,
      validFrom: c.valid_from,
      validUntil: c.valid_until,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      computedStatus,
      ordersCount,
    };
  });
}

/**
 * Retrieves a single coupon by ID for edit/inspection.
 * - OWNER ONLY.
 */
export async function getAdminCouponById(id: string): Promise<AdminCoupon | null> {
  await requireAdmin("manage_coupons");

  const adminClient = createAdminClient();

  const { data: c, error } = await adminClient
    .from("coupons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !c) {
    return null;
  }

  const { count } = await adminClient
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("coupon_code", c.code.toUpperCase());

  const ordersCount = count || 0;
  const usageCount = Math.max(c.usage_count || 0, ordersCount);

  return {
    id: c.id,
    code: c.code.toUpperCase(),
    discountType: c.discount_type as CouponDiscountType,
    discountValue: Number(c.discount_value) || 0,
    minOrderValue: Number(c.min_order_value) || 0,
    maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
    usageLimit: c.usage_limit ? Number(c.usage_limit) : null,
    usageCount,
    validFrom: c.valid_from,
    validUntil: c.valid_until,
    isActive: c.is_active,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    computedStatus: getCouponComputedStatus({
      isActive: c.is_active,
      validFrom: c.valid_from,
      validUntil: c.valid_until,
    }),
    ordersCount,
  };
}
