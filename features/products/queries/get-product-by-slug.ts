import { safeUnstableCache } from "@/lib/safe-cache";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import type { ProductDetailItem, ProductImageItem, ProductVariantItem } from "../types";
import { getSizeChart, DEFAULT_CLOTHING_SIZE_CHART } from "./get-size-chart";
import { calculateReviewBreakdown } from "@/features/reviews/queries/get-product-reviews";
import type { ProductReviewItem } from "@/features/products/types";

/**
 * Curated fabric and craftsmanship metadata for realistic PDP display
 */
const PDP_EXTENDED_METADATA: Record<
  string,
  { fabric: string; care_instructions: string; craftsmanship: string; tips: string[] }
> = {
  "chanderi-embroidered-kurta-set": {
    fabric: "Chanderi cotton blend with 100% fine cotton inner lining",
    care_instructions:
      "Dry clean recommended for first two washes. Subsequently, gentle hand wash in cold water using mild liquid detergent. Dry in shade. Warm iron inside out.",
    craftsmanship:
      "Delicate embroidery along the jewel neckline with coordinating hem border.",
    tips: ["True to size.", "For a relaxed silhouette, consider one size up."],
  },
  "festive-anarkali-set": {
    fabric: "Structured woven fabric with tonal border and inner lining",
    care_instructions: "Professional dry clean only. Store wrapped in protective cloth.",
    craftsmanship:
      "Flared 24-kali silhouette with detailed embroidery along the yoke and cuffs.",
    tips: [
      "Fitted silhouette at bust and waist with flared drape below.",
      "Consult size chart for bust measurements.",
    ],
  },
  "woven-georgette-festive-set": {
    fabric: "Georgette with tonal floral embroidery",
    care_instructions: "Dry clean only. Do not iron directly on embroidered detailing.",
    craftsmanship:
      "Woven georgette with floral motifs and coordinating drawstring ties.",
    tips: [
      "Skirt has an adjustable drawstring waist.",
      "Standard comfortable fit.",
    ],
  },
};

const DEFAULT_METADATA = {
  fabric: "Comfortable fabric blend with soft, breathable inner lining",
  care_instructions:
    "Gentle dry clean or cold hand wash. Do not bleach. Dry flat in shade. Medium warm steam iron.",
  craftsmanship: "Finished with reinforced seams and quality detailing.",
  tips: ["Standard fit.", "Refer to size guide for exact dimensions."],
};

// Single consolidated field selection — fallback removed since migration 025 is applied
const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  base_price,
  compare_at_price,
  fabric,
  care_instructions,
  craftsmanship,
  has_variants,
  stock_quantity,
  specifications,
  is_active,
  is_featured,
  is_made_to_order,
  stock_status,
  weight_grams,
  length_cm,
  width_cm,
  height_cm,
  hsn_code,
  gst_rate,
  blouse_included,
  saree_length_meters,
  seo_title,
  seo_description,
  seo_keywords,
  created_at,
  updated_at,
  category_id,
  free_shipping_active,
  free_shipping_start,
  free_shipping_end,
  free_shipping_badge_text,
  categories (
    id,
    name,
    slug,
    parent_id
  ),
  product_variants (
    id,
    size,
    color,
    color_hex,
    stock_quantity,
    sku,
    price_override,
    is_active
  ),
  product_images (
    id,
    image_url,
    alt_text,
    display_order,
    is_primary,
    variant_id
  ),
  reviews (
    id,
    customer_name,
    rating,
    title,
    comment,
    is_verified_purchase,
    is_approved,
    created_at
  ),
  size_charts (
    id,
    name,
    chart_data,
    measurement_unit
  )
`;

/**
 * Internal fetcher — hits the DB directly. No caching here.
 */
async function fetchProductBySlug(slug: string): Promise<ProductDetailItem | null> {
  const normalizedSlug = slug.toLowerCase().trim();

  try {
    const supabase = createPublicClient();

    const { data: p, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", normalizedSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[getProductBySlug] Database query failed:", error);
      throw new Error(`Database error fetching product: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    if (!p) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prod = p as any;

    const variants: ProductVariantItem[] = (prod.product_variants || []).filter(
      (v: ProductVariantItem) => v.is_active
    );

    const images: ProductImageItem[] = (prod.product_images || []).sort(
      (a: ProductImageItem, b: ProductImageItem) =>
        (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order
    );

    // Color swatches extracted from active variants
    const colorMap = new Map<string, string>();
    for (const v of variants) {
      if (v.color && !colorMap.has(v.color)) {
        colorMap.set(v.color, v.color_hex || "#888888");
      }
    }
    const colors = Array.from(colorMap.entries()).map(([color, color_hex]) => {
      const matchingVariant = variants.find((v) => v.color === color);
      const matchingImg = images.find(
        (img) =>
          (matchingVariant && img.variant_id === matchingVariant.id) ||
          img.alt_text?.toLowerCase().includes(color.toLowerCase())
      );
      return {
        color,
        color_hex,
        image_url: matchingImg?.image_url || null,
      };
    });

    const sizes: string[] = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
    const hasVariants = prod.has_variants !== false && variants.length > 0;
    const totalStock = hasVariants
      ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
      : (prod.stock_quantity ?? 999);
    const categoryData = Array.isArray(prod.categories) ? prod.categories[0] : prod.categories;

    // Calculate reviews directly from the single joined query — zero separate roundtrips
    const approvedReviews = ((prod.reviews || []) as ProductReviewItem[])
      .filter((r) => r.is_approved)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const reviewBreakdown = calculateReviewBreakdown(approvedReviews);

    // Resolve size chart from joined override or cached category default
    const hasSizeVariants = variants.some((v) => Boolean(v.size));
    let sizeChart = null;
    if (hasSizeVariants) {
      if (Array.isArray(prod.size_charts) && prod.size_charts.length > 0) {
        const sc = prod.size_charts[0];
        const scData = sc.chart_data as {
          headers?: string[];
          rows?: Record<string, string>[];
          tips?: string[];
        } | null;
        sizeChart = {
          id: sc.id,
          name: sc.name,
          measurement_unit: (sc.measurement_unit as "inches" | "cm") || "inches",
          headers: scData?.headers || DEFAULT_CLOTHING_SIZE_CHART.headers,
          rows: scData?.rows || DEFAULT_CLOTHING_SIZE_CHART.rows,
          tips: scData?.tips || DEFAULT_CLOTHING_SIZE_CHART.tips,
        };
      } else {
        sizeChart = await getSizeChart(prod.id, prod.category_id);
      }
    }

    const meta = PDP_EXTENDED_METADATA[normalizedSlug] || (hasVariants ? DEFAULT_METADATA : null);

    return {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      category_id: prod.category_id,
      category_name: categoryData?.name || null,
      category_slug: categoryData?.slug || null,
      base_price: Number(prod.base_price),
      compare_at_price: prod.compare_at_price ? Number(prod.compare_at_price) : null,
      created_at: prod.created_at,
      is_active: prod.is_active,
      is_featured: prod.is_featured,
      is_new: Date.now() - new Date(prod.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
      stock_status: prod.stock_status,
      has_variants: hasVariants,
      stock_quantity: prod.stock_quantity ?? totalStock,
      specifications: Array.isArray(prod.specifications) ? prod.specifications : [],
      images,
      variants,
      colors,
      sizes,
      total_stock: totalStock,
      rating:
        reviewBreakdown.totalCount > 0
          ? { average: reviewBreakdown.average, count: reviewBreakdown.totalCount }
          : null,
      fabric: prod.fabric || meta?.fabric || null,
      care_instructions: prod.care_instructions || meta?.care_instructions || null,
      craftsmanship: prod.craftsmanship || meta?.craftsmanship || null,
      is_made_to_order: prod.is_made_to_order,
      weight_grams: prod.weight_grams,
      length_cm: prod.length_cm,
      width_cm: prod.width_cm,
      height_cm: prod.height_cm,
      hsn_code: prod.hsn_code || "6204",
      gst_rate: Number(prod.gst_rate) || 5,
      blouse_included: prod.blouse_included ?? false,
      saree_length_meters: prod.saree_length_meters,
      seo_title: prod.seo_title,
      seo_description: prod.seo_description,
      seo_keywords: prod.seo_keywords ?? undefined,
      size_chart: sizeChart,
      reviews_breakdown: reviewBreakdown,
      reviews: approvedReviews,
      free_shipping_active: Boolean(prod.free_shipping_active),
      free_shipping_start: prod.free_shipping_start || null,
      free_shipping_end: prod.free_shipping_end || null,
      free_shipping_badge_text: prod.free_shipping_badge_text || null,
    };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }

    console.error("[getProductBySlug] Database error:", err);
    throw err;
  }
}

/**
 * Cross-request cache: revalidates every 5 minutes or when 'products' tag is busted.
 * Bust with revalidateTag('products') whenever a product is saved/updated in admin actions.
 */
const getCachedProductBySlug = safeUnstableCache(
  fetchProductBySlug,
  ["product-by-slug"],
  { tags: ["products"], revalidate: 300 }
);

/**
 * Per-request memoization via React cache():
 * guarantees that generateMetadata() and the Page component share ONE DB call per request.
 * Cross-request result comes from unstable_cache above.
 */
export const getProductBySlug = cache(getCachedProductBySlug);
