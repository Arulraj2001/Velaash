import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SavedCustomerAddress } from "../types";

/**
 * Server query to fetch saved addresses for a logged-in customer.
 * Ordered with the default address pinned first, followed by newest created.
 * Returns an empty array for guest users or upon database read failure.
 */
export async function getCustomerAddresses(
  customerId?: string | null
): Promise<SavedCustomerAddress[]> {
  if (!customerId) return [];

  try {
    let supabase;
    try {
      supabase = await createClient();
    } catch {
      // Fallback to admin client when called outside request scope (e.g. tests)
      supabase = createAdminClient();
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("id, full_name, phone, address_line1, address_line2, city, state, pincode, address_type, is_default, created_at, updated_at")
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching customer addresses:", error);
      return [];
    }

    return data.map((addr) => ({
      id: addr.id,
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      addressType: addr.address_type as "home" | "work" | "other",
      isDefault: addr.is_default,
      createdAt: addr.created_at,
      updatedAt: addr.updated_at,
    }));
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("Unexpected error in getCustomerAddresses:", err);
    return [];
  }
}
