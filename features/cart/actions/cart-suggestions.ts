"use server";

import { createClient } from "@/lib/supabase/server";
import { getRelatedProducts } from "@/features/products/queries/get-related-products";
import type { ProductListItem } from "@/features/products/types";

/**
 * Server Action to fetch lightweight, category-based product recommendations for the Cart page.
 * Finds the categories of products currently in the customer's cart,
 * queries related active products from those categories, and strictly excludes
 * any items already in the cart.
 */
export async function getCartSuggestionsAction(
  cartProductIds: string[]
): Promise<ProductListItem[]> {
  if (!cartProductIds || cartProductIds.length === 0) {
    return [];
  }

  try {
    const supabase = await createClient();

    // 1. Resolve category IDs of items currently in the cart
    const { data: cartItemsData, error } = await supabase
      .from("products")
      .select("category_id")
      .in("id", cartProductIds);

    if (error) {
      console.error("[getCartSuggestionsAction] Error resolving cart categories:", error);
    }

    const categoryIds = Array.from(
      new Set((cartItemsData || []).map((p) => p.category_id).filter(Boolean) as string[])
    );

    // 2. Fetch up to 4 recommendations from these categories, excluding cart items
    const suggestions = await getRelatedProducts({
      excludeProductIds: cartProductIds,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      limit: 4,
    });

    return suggestions;
  } catch (err) {
    console.error("[getCartSuggestionsAction] Error fetching suggestions:", err);
    return [];
  }
}
