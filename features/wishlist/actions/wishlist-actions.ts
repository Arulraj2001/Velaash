"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WishlistActionResult } from "../types";

/**
 * Core headless execution function to toggle wishlist state for a customer.
 * Decoupled from Next.js request context for standalone testability.
 */
export async function executeToggleWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  productId: string
): Promise<WishlistActionResult> {
  if (!customerId || !productId) {
    return { success: false, error: "Customer ID and Product ID are required." };
  }

  // 1. Check if the product is already wishlisted
  const { data: existing, error: checkError } = await supabase
    .from("wishlists")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking wishlist status:", checkError);
    return { success: false, error: "Failed to read wishlist status." };
  }

  if (existing) {
    // 2. Remove from wishlist
    const { error: deleteError } = await supabase
      .from("wishlists")
      .delete()
      .eq("customer_id", customerId)
      .eq("product_id", productId);

    if (deleteError) {
      console.error("Error removing from wishlist:", deleteError);
      return { success: false, error: "Failed to remove item from wishlist." };
    }

    return {
      success: true,
      isWishlisted: false,
      productId,
    };
  } else {
    // 3. Add to wishlist
    const { error: insertError } = await supabase
      .from("wishlists")
      .insert({
        customer_id: customerId,
        product_id: productId,
      });

    if (insertError) {
      console.error("Error adding to wishlist:", insertError);
      return { success: false, error: "Failed to add item to wishlist." };
    }

    return {
      success: true,
      isWishlisted: true,
      productId,
    };
  }
}

/**
 * Core headless execution function to explicitly remove an item from a customer's wishlist.
 */
export async function executeRemoveFromWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  productId: string
): Promise<WishlistActionResult> {
  if (!customerId || !productId) {
    return { success: false, error: "Customer ID and Product ID are required." };
  }

  const { error: deleteError } = await supabase
    .from("wishlists")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (deleteError) {
    console.error("Error removing item from wishlist:", deleteError);
    return { success: false, error: "Failed to remove item from wishlist." };
  }

  return {
    success: true,
    isWishlisted: false,
    productId,
  };
}

// ============================================================================
// SERVER ACTIONS (Next.js Authenticated Customer Scope)
// ============================================================================

/**
 * Server action to toggle wishlist state for the currently authenticated customer.
 */
export async function toggleWishlistAction(
  productId: string
): Promise<WishlistActionResult> {
  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return {
      success: false,
      error: "Please sign in to save items to your wishlist.",
    };
  }

  const supabase = createAdminClient();
  const result = await executeToggleWishlist(supabase, authData.user.id, productId);

  if (result.success) {
    revalidatePath("/account/wishlist");
    revalidatePath("/shop");
    revalidatePath("/");
  }

  return result;
}

/**
 * Server action to remove an item from the customer's wishlist.
 */
export async function removeFromWishlistAction(
  productId: string
): Promise<WishlistActionResult> {
  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return {
      success: false,
      error: "Please sign in to manage your wishlist.",
    };
  }

  const supabase = createAdminClient();
  const result = await executeRemoveFromWishlist(supabase, authData.user.id, productId);

  if (result.success) {
    revalidatePath("/account/wishlist");
    revalidatePath("/shop");
    revalidatePath("/");
  }

  return result;
}
