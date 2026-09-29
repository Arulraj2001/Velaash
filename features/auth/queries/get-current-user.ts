import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";

export interface CurrentUserResponse {
  user: User;
  customer: Tables<"customers"> | null;
}

/**
 * Server-side query to get the currently authenticated customer
 * and their associated database profile.
 */
export async function getCurrentUser(): Promise<CurrentUserResponse | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user,
      customer,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to fetch current user session:", error);
    return null;
  }
}
