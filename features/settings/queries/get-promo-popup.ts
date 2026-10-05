import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { getSiteSettings } from "./get-site-settings";

export interface LivePromoCoupon {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  validUntil: string;
}

export interface PromoProductThumbnail {
  imageUrl: string;
  name?: string;
}

export interface PromoPopupDisplayData {
  isEnabled: boolean;
  title: string;
  description: string;
  delaySeconds: number;
  coupon: LivePromoCoupon;
  featuredProduct?: PromoProductThumbnail | null;
}

/**
 * Internal fetch. Do not call outside of the cached wrappers below.
 */
async function fetchPromoPopup(): Promise<PromoPopupDisplayData | null> {
  try {
    const settings = await getSiteSettings();
    const { promoPopup } = settings;

    if (!promoPopup || !promoPopup.is_enabled || !promoPopup.featured_coupon_id) {
      return null;
    }

    const supabase = createPublicClient();

    // Query the linked coupon record live
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select(
        "id, code, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, valid_from, valid_until, is_active"
      )
      .eq("id", promoPopup.featured_coupon_id)
      .maybeSingle();

    if (error || !coupon) {
      return null;
    }

    // Re-validate coupon status at render time
    if (!coupon.is_active) {
      return null;
    }

    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now < validFrom || now > validUntil) {
      return null;
    }

    if (coupon.usage_limit !== null && (coupon.usage_count || 0) >= coupon.usage_limit) {
      return null;
    }

    // Query one real active featured product thumbnail from the database
    const featuredProduct = await getFeaturedProductThumbnail(supabase);

    return {
      isEnabled: true,
      title: promoPopup.popup_title,
      description: promoPopup.popup_description,
      delaySeconds: promoPopup.delay_seconds ?? 9,
      coupon: {
        id: coupon.id,
        code: coupon.code.toUpperCase(),
        discountType: coupon.discount_type === "percentage" ? "percentage" : "flat",
        discountValue: coupon.discount_value,
        minOrderValue: coupon.min_order_value,
        maxDiscountAmount: coupon.max_discount_amount,
        validUntil: coupon.valid_until,
      },
      featuredProduct,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    return null;
  }
}

/**
 * Cached promo popup: revalidates every 5 minutes.
 * Bust with revalidateTag('site-settings') when admin saves promo settings.
 */
const getCachedPromoPopup = unstable_cache(
  fetchPromoPopup,
  ["promo-popup"],
  { tags: ["site-settings"], revalidate: 300 }
);

/**
 * Request-level deduplicated + cross-request cached promo popup.
 */
export const getPromoPopup = cache(getCachedPromoPopup);


/**
 * Queries one real featured or active product image from the database
 * to display as a small rounded thumbnail on the promo popup modal.
 */
export async function getFeaturedProductThumbnail(
  existingClient?: ReturnType<typeof createPublicClient>
): Promise<PromoProductThumbnail | null> {
  try {
    const supabase = existingClient || createPublicClient();

    // 1. Prioritize active products marked as is_featured = true
    const { data: featuredProducts } = await supabase
      .from("products")
      .select("id, name, product_images(image_url, is_primary, display_order)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(1);

    let product = featuredProducts?.[0];

    // 2. Fallback to any active product if no featured product found
    if (!product) {
      const { data: fallbackProducts } = await supabase
        .from("products")
        .select("id, name, product_images(image_url, is_primary, display_order)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      product = fallbackProducts?.[0];
    }

    if (product && product.product_images && product.product_images.length > 0) {
      const sorted = [...product.product_images].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      });
      const primaryImg = sorted[0];
      if (primaryImg?.image_url) {
        return {
          imageUrl: primaryImg.image_url,
          name: product.name,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
