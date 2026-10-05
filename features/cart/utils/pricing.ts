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
 * Razorpay order generation, and payment verification) MUST
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
    discountType: "percentage" | "flat" | "free_shipping";
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number | null;
  },
  subtotal: number
): number {
  if (subtotal < coupon.minOrderValue) {
    return 0;
  }

  // Free shipping coupons waive the delivery fee directly, keeping product subtotal intact
  if (coupon.discountType === "free_shipping") {
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

  const now = new Date();
  const freeThreshold = shippingPolicy.free_shipping_threshold;
  const isThresholdFree = subtotal >= freeThreshold;

  // Check festive campaign eligibility
  let isFestiveActive = false;
  if (shippingPolicy.festive_shipping_enabled) {
    const validFrom = shippingPolicy.festive_valid_from
      ? new Date(shippingPolicy.festive_valid_from)
      : null;
    const validUntil = shippingPolicy.festive_valid_until
      ? new Date(shippingPolicy.festive_valid_until)
      : null;
    if (validUntil && validUntil.getHours() === 0 && validUntil.getMinutes() === 0) {
      validUntil.setHours(23, 59, 59, 999);
    }
    const isAfterStart = !validFrom || now >= validFrom;
    const isBeforeEnd = !validUntil || now <= validUntil;
    isFestiveActive = isAfterStart && isBeforeEnd;
  }

  // Check if any available item in cart qualifies for festive free shipping
  const hasFestiveProduct =
    isFestiveActive &&
    (shippingPolicy.festive_apply_to_all ||
      availableItems.some((item) => {
        if (shippingPolicy.festive_product_ids?.includes(item.productId)) return true;
        if (item.slug && shippingPolicy.festive_product_ids?.includes(item.slug)) return true;
        return false;
      }));

  // Check if any available item has direct product-level free shipping
  const productWithDirectFreeShipping = availableItems.find((item) => {
    if (!item.freeShippingActive) return false;
    const start = item.freeShippingStart ? new Date(item.freeShippingStart) : null;
    const end = item.freeShippingEnd ? new Date(item.freeShippingEnd) : null;
    if (end && end.getHours() === 0 && end.getMinutes() === 0) {
      end.setHours(23, 59, 59, 999);
    }
    const isAfterStart = !start || now >= start;
    const isBeforeEnd = !end || now <= end;
    return isAfterStart && isBeforeEnd;
  });
  const hasDirectFreeShipping = Boolean(productWithDirectFreeShipping);

  // Check if coupon grants free shipping
  const isCouponFree = Boolean(
    activeCoupon &&
      (activeCoupon.discountType === "free_shipping" ||
        (shippingPolicy.festive_coupon_code &&
          activeCoupon.code.toUpperCase() === shippingPolicy.festive_coupon_code.toUpperCase()))
  );

  const isFreeShipping =
    subtotal > 0 && (isThresholdFree || hasFestiveProduct || hasDirectFreeShipping || isCouponFree);

  let freeShippingReason: "threshold" | "product_offer" | "coupon" | null = null;
  let freeShippingBadgeText: string | null = null;

  if (isFreeShipping) {
    if (hasDirectFreeShipping) {
      freeShippingReason = "product_offer";
      freeShippingBadgeText =
        productWithDirectFreeShipping?.freeShippingBadgeText || "🌾 Free Delivery";
    } else if (hasFestiveProduct) {
      freeShippingReason = "product_offer";
      freeShippingBadgeText =
        shippingPolicy.festive_badge_text || "🌾 Festive Special: Free Delivery";
    } else if (isCouponFree) {
      freeShippingReason = "coupon";
      freeShippingBadgeText = `Code ${activeCoupon?.code}: Free Shipping`;
    } else if (isThresholdFree) {
      freeShippingReason = "threshold";
      freeShippingBadgeText = "Free Shipping";
    }
  }

  const shippingFee =
    subtotal === 0 ? 0 : isFreeShipping ? 0 : shippingPolicy.standard_shipping_fee;
  const amountNeededForFreeShipping =
    hasFestiveProduct || hasDirectFreeShipping || isCouponFree ? 0 : Math.max(0, freeThreshold - subtotal);
  const freeShippingProgress =
    hasFestiveProduct || hasDirectFreeShipping || isCouponFree || isThresholdFree
      ? 100
      : freeThreshold > 0
        ? Math.min(100, Math.round((subtotal / freeThreshold) * 100))
        : 100;

  const total = Math.max(0, subtotal - discount) + shippingFee;

  return {
    subtotal,
    discount,
    shippingFee,
    isFreeShipping,
    freeShippingReason,
    freeShippingBadgeText,
    amountNeededForFreeShipping,
    freeShippingProgress,
    total,
    appliedCoupon: activeCoupon,
    couponError,
  };
}
