import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lightweight query to fetch just the array of product IDs in a customer's wishlist.
 * Used for fast navbar badge hydration and initial client state.
 */
export async function getWishlistProductIds(
  customerId?: string | null
): Promise<string[]> {
  if (!customerId) return [];

  try {
    let supabase;
    try {
      const client = await createClient();
      const { data: { user } } = await client.auth.getUser();
      supabase = user ? client : createAdminClient();
    } catch {
      supabase = createAdminClient();
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching wishlist product IDs:", error);
      return [];
    }

    return data.map((row) => row.product_id);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }

    console.error("Unexpected error in getWishlistProductIds:", err);
    return [];
  }
}
