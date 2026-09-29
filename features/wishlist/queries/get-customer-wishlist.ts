import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRawProductToListItem } from "@/features/products/utils/map-product";
import type { RawDbProduct, ProductListItem } from "@/features/products/types";
import type { CustomerWishlistResponse } from "../types";

const WISHLIST_PRODUCT_SELECT = `
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
`;

/**
 * Server query to fetch all wishlisted products for a customer.
 * Returns products in reverse-chronological order of being wishlisted (newest first).
 * Inactive / unpublished products are preserved with is_active = false so the UI
 * can display a graceful "No longer available" indicator instead of breaking.
 */
export async function getCustomerWishlist(
  customerId?: string | null
): Promise<CustomerWishlistResponse> {
  if (!customerId) {
    return {
      products: [],
      wishlistProductIds: [],
      totalCount: 0,
    };
  }

  try {
    let supabase;
    try {
      supabase = await createClient();
    } catch {
      supabase = createAdminClient();
    }

    // 1. Fetch wishlist rows for the customer
    const { data: wishlistRows, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id, product_id, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (wishlistError || !wishlistRows || wishlistRows.length === 0) {
      if (wishlistError) {
        console.error("Database error fetching wishlists:", wishlistError);
      }
      return {
        products: [],
        wishlistProductIds: [],
        totalCount: 0,
      };
    }

    const wishlistProductIds = wishlistRows.map((row) => row.product_id);

    // 2. Fetch full product records for wishlisted items
    // Note: We deliberately do NOT filter out inactive products here so that
    // the UI can render them gracefully as "Unavailable" without breaking the grid.
    const { data: rawProducts, error: productError } = await supabase
      .from("products")
      .select(WISHLIST_PRODUCT_SELECT)
      .in("id", wishlistProductIds);

    if (productError || !rawProducts) {
      console.error("Database error fetching wishlisted products:", productError);
      return {
        products: [],
        wishlistProductIds,
        totalCount: 0,
      };
    }

    // Index products by ID for fast, ordered reconstruction
    const productMap = new Map<string, RawDbProduct>();
    for (const p of rawProducts as unknown as RawDbProduct[]) {
      productMap.set(p.id, p);
    }

    const orderedProducts: ProductListItem[] = [];
    const now = Date.now();

    for (const row of wishlistRows) {
      const rawProduct = productMap.get(row.product_id);
      if (rawProduct) {
        orderedProducts.push(mapRawProductToListItem(rawProduct, now));
      }
    }

    return {
      products: orderedProducts,
      wishlistProductIds,
      totalCount: orderedProducts.length,
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

    console.error("Unexpected error in getCustomerWishlist:", err);
    return {
      products: [],
      wishlistProductIds: [],
      totalCount: 0,
    };
  }
}
