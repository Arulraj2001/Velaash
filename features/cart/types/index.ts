import { z } from "zod";

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional().nullable().or(z.literal("")),
  title: z.string(),
  slug: z.string(),
  size: z.string().optional().nullable().or(z.literal("")),
  color: z.string().optional().nullable().or(z.literal("")),
  colorHex: z.string().optional().nullable().or(z.literal("")),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  image: z.string(),
  quantity: z.number().int().positive().max(10),
  maxStock: z.number().int().nonnegative().default(10),
  isAvailable: z.boolean().default(true),
  availabilityWarning: z.string().optional(),
  priceUpdated: z.boolean().optional(),
  freeShippingActive: z.boolean().optional(),
  freeShippingStart: z.string().optional().nullable(),
  freeShippingEnd: z.string().optional().nullable(),
  freeShippingBadgeText: z.string().optional().nullable(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "flat" | "free_shipping";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number | null;
  discountAmount: number;
}

export interface ShippingPolicyData {
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  festive_shipping_enabled?: boolean;
  festive_campaign_name?: string;
  festive_badge_text?: string;
  festive_valid_from?: string | null;
  festive_valid_until?: string | null;
  festive_product_ids?: string[];
  festive_category_ids?: string[];
  festive_coupon_code?: string | null;
  festive_apply_to_all?: boolean;
}

/**
 * Shared calculation output for client UI and future server-side checkout validation
 */
export interface CartCalculationResult {
  subtotal: number;
  discount: number;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingReason?: "threshold" | "product_offer" | "coupon" | null;
  freeShippingBadgeText?: string | null;
  amountNeededForFreeShipping: number;
  freeShippingProgress: number; // 0 to 100
  total: number;
  appliedCoupon: AppliedCoupon | null;
  couponError?: string | null;
}

export type CouponValidationResponse =
  | {
      success: true;
      coupon: {
        id: string;
        code: string;
        discountType: "percentage" | "flat" | "free_shipping";
        discountValue: number;
        minOrderValue: number;
        maxDiscountAmount: number | null;
      };
      discountAmount: number;
      notice?: string | null;
    }
  | {
      success: false;
      error: string;
    };

export interface RevalidatedCartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  currentPrice: number;
  priceChanged: boolean;
  availableStock: number;
  isAvailable: boolean;
  quantityAdjusted: boolean;
  adjustedQuantity: number;
  message?: string;
}

export interface RevalidateCartResponse {
  items: RevalidatedCartItem[];
  validatedCoupon: AppliedCoupon | null;
  couponError?: string | null;
}
