import { createClient } from "@/lib/supabase/server";
import type { ProductListItem, RawDbProduct } from "../types";

export async function getRelatedProducts(
  productId: string,
  categoryId?: string | null,
  limit = 4
): Promise<ProductListItem[]> {
  try {
    const supabase = await createClient();

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
        ),
        reviews (
          rating,
          is_approved
        )
      `
      )
      .eq("is_active", true)
      .neq("id", productId)
      .limit(limit);

    if (categoryId) {
      q = q.eq("category_id", categoryId);
    }

    const { data: dbProducts, error } = await q;

    if (error) {
      console.error("Database query failed in getRelatedProducts:", error);
      throw new Error(`Database query failed in getRelatedProducts: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    if (!dbProducts || dbProducts.length === 0) {
      return [];
    }

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
