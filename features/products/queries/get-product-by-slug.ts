import { createClient } from "@/lib/supabase/server";
import type { ProductDetailItem, ProductImageItem, ProductVariantItem } from "../types";
import { getSizeChart } from "./get-size-chart";
import { getProductReviews } from "@/features/reviews/queries/get-product-reviews";

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

export async function getProductBySlug(slug: string): Promise<ProductDetailItem | null> {
  const normalizedSlug = slug.toLowerCase().trim();

  try {
    const supabase = await createClient();

    const selectFieldsWithNew = `
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
      )
    `;

    const selectFieldsFallback = `
      id,
      name,
      slug,
      description,
      base_price,
      compare_at_price,
      fabric,
      care_instructions,
      craftsmanship,
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
      )
    `;

    // Try query with new schema columns first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let p: any = null;
    const { data: primaryData, error: primaryError } = await supabase
      .from("products")
      .select(selectFieldsWithNew)
      .eq("slug", normalizedSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!primaryError) {
      p = primaryData;
    } else {
      // Fallback query if remote database has not applied column migration yet
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("products")
        .select(selectFieldsFallback)
        .eq("slug", normalizedSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (fallbackError) {
        console.error("Database query failed in getProductBySlug:", fallbackError);
        throw new Error(`Database error fetching product: ${fallbackError.message} (${fallbackError.code || "UNKNOWN"})`);
      }
      p = fallbackData;
    }

    if (!p) {
      return null;
    }

    const variants: ProductVariantItem[] = (p.product_variants || []).filter(
      (v: ProductVariantItem) => v.is_active
    );

    const images: ProductImageItem[] = (p.product_images || []).sort(
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
    const hasVariants = p.has_variants !== false && variants.length > 0;
    const totalStock = hasVariants
      ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
      : (p.stock_quantity ?? 999);
    const categoryData = Array.isArray(p.categories) ? p.categories[0] : p.categories;

    // Only fetch size chart if product has size variants
    const hasSizeVariants = variants.some((v) => Boolean(v.size));
    const [sizeChart, reviewData] = await Promise.all([
      hasSizeVariants ? getSizeChart(p.id, p.category_id) : Promise.resolve(null),
      getProductReviews(p.id),
    ]);

    const meta = PDP_EXTENDED_METADATA[normalizedSlug] || (hasVariants ? DEFAULT_METADATA : null);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category_id: p.category_id,
      category_name: categoryData?.name || null,
      category_slug: categoryData?.slug || null,
      base_price: Number(p.base_price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      created_at: p.created_at,
      is_active: p.is_active,
      is_featured: p.is_featured,
      is_new: Date.now() - new Date(p.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
      stock_status: p.stock_status,
      has_variants: hasVariants,
      stock_quantity: p.stock_quantity ?? totalStock,
      specifications: Array.isArray(p.specifications) ? p.specifications : [],
      images,
      variants,
      colors,
      sizes,
      total_stock: totalStock,
      rating:
        reviewData.breakdown.totalCount > 0
          ? { average: reviewData.breakdown.average, count: reviewData.breakdown.totalCount }
          : null,
      fabric: p.fabric || meta?.fabric || null,
      care_instructions: p.care_instructions || meta?.care_instructions || null,
      craftsmanship: p.craftsmanship || meta?.craftsmanship || null,
      is_made_to_order: p.is_made_to_order,
      weight_grams: p.weight_grams,
      length_cm: p.length_cm,
      width_cm: p.width_cm,
      height_cm: p.height_cm,
      hsn_code: p.hsn_code || "6204",
      gst_rate: Number(p.gst_rate) || 5,
      blouse_included: p.blouse_included ?? false,
      saree_length_meters: p.saree_length_meters,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      seo_keywords: p.seo_keywords ?? undefined,
      size_chart: sizeChart,
      reviews_breakdown: reviewData.breakdown,
      reviews: reviewData.reviews,
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
