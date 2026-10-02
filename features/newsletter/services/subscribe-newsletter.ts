import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type NewsletterSubscribeResult =
  | { success: true; alreadySubscribed: boolean }
  | { success: false; error: string };

export async function persistNewsletterSubscription(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<NewsletterSubscribeResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: normalizedEmail });

  if (!error) {
    return { success: true, alreadySubscribed: false };
  }

  if (error.code === "23505") {
    return { success: true, alreadySubscribed: true };
  }

  console.error("Newsletter subscription failed:", error);
  return {
    success: false,
    error: "We could not save your subscription right now. Please try again shortly.",
  };
}