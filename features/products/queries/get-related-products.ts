import { createClient } from "@/lib/supabase/server";
import type { ProductListItem, RawDbProduct } from "../types";
import { MOCK_CLOTHING_PRODUCTS } from "./mock-products";

function isPlaceholderEnvironment(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("placeholder-project") || url.includes("example.com");
}

export async function getRelatedProducts(
  productId: string,
  categoryId?: string | null,
  limit = 4
): Promise<ProductListItem[]> {
  try {
    const supabase = await createClient();

    const buildQuery = (includeReviews: boolean) => {
      let q = supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          description,
          base_price,
          compare_at_price,
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
          )${
            includeReviews
              ? `,
          reviews (
            rating,
            is_approved
          )`
              : ""
          }
        `
        )
        .eq("is_active", true)
        .neq("id", productId)
        .limit(limit);

      if (categoryId) {
        q = q.eq("category_id", categoryId);
      }
      return q;
    };

    let { data: dbProducts, error } = await buildQuery(true);

    if (
      error &&
      (error.code === "PGRST200" ||
        error.code === "42P01" ||
        error.message?.includes("reviews") ||
        error.details?.includes("reviews"))
    ) {
      const retryResult = await buildQuery(false);
      dbProducts = retryResult.data;
      error = retryResult.error;
    }

    if (error && !isPlaceholderEnvironment() && !error.message?.includes("fetch failed")) {
      const errorMsg = error.message || error.details || error.code || "query failed";
      console.warn(`[getRelatedProducts] Database notice: ${errorMsg}`);
    }

    if (dbProducts && dbProducts.length > 0) {
      const now = Date.now();
      const rawProducts = dbProducts as unknown as RawDbProduct[];
      return rawProducts.map((p) => {
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
        const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
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
          images,
          variants,
          colors,
          sizes,
          total_stock: totalStock,
          rating: avgRating ? { average: avgRating, count: approvedReviews.length } : null,
        };
      });
    }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
  }

  // Fallback to mock clothing products
  const pool = MOCK_CLOTHING_PRODUCTS.filter((p) => p.id !== productId);
  const matchingCat = pool.filter((p) => categoryId && p.category_id === categoryId);
  const selected = matchingCat.length >= limit ? matchingCat.slice(0, limit) : pool.slice(0, limit);

  return selected;
}
