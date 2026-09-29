import type {
  CartItem,
  AppliedCoupon,
  ShippingPolicyData,
  CartCalculationResult,
} from "../types";

/**
 * ============================================================================
 * SHARED CART PRICING & COUPON DISCOUNT CALCULATION
 * ============================================================================
 * NOTE: [SECURITY ARCHITECTURE MANDATE]
 * This shared utility provides consistent math across the customer-facing
 * Cart Page, checkout previews, and server actions.
 *
 * CRITICAL: The final authoritative calculation at checkout (order placement,
 * Razorpay order generation, and payment verification in Phase 3B/3C) MUST
 * ALWAYS happen server-side against fresh Postgres records. Client-side numbers
 * must NEVER be trusted for financial transactions.
 * ============================================================================
 */

export const DEFAULT_SHIPPING_POLICY: ShippingPolicyData = {
  free_shipping_threshold: 999, // Dynamic placeholder from site_settings
  standard_shipping_fee: 100,
};

/**
 * Calculates discount amount for a given coupon and subtotal
 */
export function calculateCouponDiscount(
  coupon: {
    discountType: "percentage" | "flat";
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number | null;
  },
  subtotal: number
): number {
  if (subtotal < coupon.minOrderValue) {
    return 0;
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === "flat") {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  // Round to nearest integer for clean INR pricing
  return Math.round(discount);
}

/**
 * Pure calculation function for cart totals, shipping threshold progress, and discounts.
 */
export function calculateCartTotals({
  items,
  appliedCoupon,
  shippingPolicy = DEFAULT_SHIPPING_POLICY,
}: {
  items: CartItem[];
  appliedCoupon?: AppliedCoupon | null;
  shippingPolicy?: ShippingPolicyData;
}): CartCalculationResult {
  // Only available items contribute to subtotal
  const availableItems = items.filter((item) => item.isAvailable !== false);
  const subtotal = availableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let discount = 0;
  let couponError: string | null = null;
  let activeCoupon: AppliedCoupon | null = null;

  if (appliedCoupon && subtotal > 0) {
    if (subtotal < appliedCoupon.minOrderValue) {
      couponError = `Order subtotal must be at least ₹${appliedCoupon.minOrderValue.toLocaleString(
        "en-IN"
      )} to use coupon ${appliedCoupon.code}.`;
      discount = 0;
      activeCoupon = {
        ...appliedCoupon,
        discountAmount: 0,
      };
    } else {
      discount = calculateCouponDiscount(appliedCoupon, subtotal);
      activeCoupon = {
        ...appliedCoupon,
        discountAmount: discount,
      };
    }
  }

  const freeThreshold = shippingPolicy.free_shipping_threshold;
  const isFreeShipping = subtotal >= freeThreshold;
  const shippingFee = subtotal === 0 ? 0 : isFreeShipping ? 0 : shippingPolicy.standard_shipping_fee;
  const amountNeededForFreeShipping = Math.max(0, freeThreshold - subtotal);
  const freeShippingProgress =
    freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100;

  const total = Math.max(0, subtotal - discount) + shippingFee;

  return {
    subtotal,
    discount,
    shippingFee,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingProgress,
    total,
    appliedCoupon: activeCoupon,
    couponError,
  };
}
