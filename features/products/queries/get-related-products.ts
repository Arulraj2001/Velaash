import { safeUnstableCache } from "@/lib/safe-cache";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import type { ProductListItem, RawDbProduct } from "../types";

export interface GetRelatedProductsOptions {
  productId?: string;
  excludeProductIds?: string[];
  categoryId?: string | null;
  categoryIds?: string[];
  limit?: number;
}

const RELATED_SELECT = `
  id,
  name,
  slug,
  description,
  base_price,
  compare_at_price,
  has_variants,
  stock_quantity,
  specifications,
  created_at,
  is_active,
  is_featured,
  stock_status,
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
  ),
  reviews (
    rating,
    is_approved
  )
`;

function mapDbProductsToListItems(dbProducts: RawDbProduct[]): ProductListItem[] {
  const now = Date.now();
  return dbProducts.map((p) => {
    const variants = (p.product_variants || [])
      .filter((v) => v.is_active)
      .map((v) => ({ ...v, sku: v.sku || "" }));
    const images = (p.product_images || []).sort(
      (a, b) =>
        (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order
    );
    const approvedReviews = (p.reviews || []).filter((r) => r.is_approved);
    const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
      approvedReviews.length > 0
        ? Number((totalRating / approvedReviews.length).toFixed(1))
        : null;

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

    const sizes: string[] = Array.from(new Set(variants.map((v) => v.size)));
    const hasVariants = p.has_variants !== false && variants.length > 0;
    const totalStock = hasVariants
      ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
      : (Number(p.stock_quantity) || 0);
    const categoryData = Array.isArray(p.categories) ? p.categories[0] : p.categories;

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
      is_new: now - new Date(p.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
      stock_status: p.stock_status,
      has_variants: hasVariants,
      stock_quantity: Number(p.stock_quantity) || totalStock,
      specifications: Array.isArray(p.specifications) ? p.specifications : [],
      images,
      variants,
      colors,
      sizes,
      total_stock: totalStock,
      rating: avgRating ? { average: avgRating, count: approvedReviews.length } : null,
    };
  });
}

async function fetchRelatedProducts(
  productIdOrOptions: string | GetRelatedProductsOptions,
  categoryId?: string | null,
  limit = 4
): Promise<ProductListItem[]> {
  try {
    const supabase = createPublicClient();

    let excludeIds: string[] = [];
    let catIds: string[] = [];
    let targetLimit = limit;

    if (typeof productIdOrOptions === "object" && productIdOrOptions !== null) {
      if (productIdOrOptions.excludeProductIds) {
        excludeIds = [...productIdOrOptions.excludeProductIds];
      }
      if (productIdOrOptions.productId && !excludeIds.includes(productIdOrOptions.productId)) {
        excludeIds.push(productIdOrOptions.productId);
      }
      if (productIdOrOptions.categoryIds) {
        catIds = [...productIdOrOptions.categoryIds].filter(Boolean) as string[];
      }
      if (productIdOrOptions.categoryId && !catIds.includes(productIdOrOptions.categoryId)) {
        catIds.push(productIdOrOptions.categoryId);
      }
      targetLimit = productIdOrOptions.limit ?? 4;
    } else {
      if (productIdOrOptions) {
        excludeIds = [productIdOrOptions];
      }
      if (categoryId) {
        catIds = [categoryId];
      }
      targetLimit = limit;
    }

    let q = supabase
      .from("products")
      .select(RELATED_SELECT)
      .eq("is_active", true)
      .limit(targetLimit);

    if (excludeIds.length === 1) {
      q = q.neq("id", excludeIds[0]);
    } else if (excludeIds.length > 1) {
      q = q.not("id", "in", `(${excludeIds.join(",")})`);
    }

    if (catIds.length === 1) {
      q = q.eq("category_id", catIds[0]);
    } else if (catIds.length > 1) {
      q = q.in("category_id", catIds);
    }

    const { data: dbProducts, error } = await q;

    if (error) {
      console.error("Database query failed in getRelatedProducts:", error);
      throw new Error(`Database query failed in getRelatedProducts: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    let items = mapDbProductsToListItems((dbProducts || []) as unknown as RawDbProduct[]);

    // If category-specific matching returned fewer than targetLimit products and categories were requested,
    // backfill with general active featured products (excluding all current items) so customers always see suggestions
    if (items.length < targetLimit && catIds.length > 0) {
      const needed = targetLimit - items.length;
      const allExclude = Array.from(new Set([...excludeIds, ...items.map((i) => i.id)]));

      let backfillQuery = supabase
        .from("products")
        .select(RELATED_SELECT)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(needed);

      if (allExclude.length === 1) {
        backfillQuery = backfillQuery.neq("id", allExclude[0]);
      } else if (allExclude.length > 1) {
        backfillQuery = backfillQuery.not("id", "in", `(${allExclude.join(",")})`);
      }

      const { data: backfillData } = await backfillQuery;
      if (backfillData && backfillData.length > 0) {
        const backfillItems = mapDbProductsToListItems(backfillData as unknown as RawDbProduct[]);
        items = [...items, ...backfillItems];
      }
    }

    return items;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("[getRelatedProducts] Database error:", err);
    throw err;
  }
}

/**
 * Cross-request cache: related products rarely change, so we use a 10-minute TTL.
 * Bust with revalidateTag('products') when any product is updated.
 */
const getCachedRelatedProducts = safeUnstableCache(
  fetchRelatedProducts,
  ["related-products"],
  { tags: ["products"], revalidate: 600 }
);

export const getRelatedProducts = cache(getCachedRelatedProducts);
