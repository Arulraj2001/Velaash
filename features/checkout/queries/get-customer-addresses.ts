import { createClient } from "@/lib/supabase/server";
import type { SavedCustomerAddress } from "../types";

/**
 * Server query to fetch saved addresses for a logged-in customer.
 * Returns an empty array for guest users or upon database read failure.
 */
export async function getCustomerAddresses(
  customerId?: string | null
): Promise<SavedCustomerAddress[]> {
  if (!customerId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) {
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
    return [];
  }
}
