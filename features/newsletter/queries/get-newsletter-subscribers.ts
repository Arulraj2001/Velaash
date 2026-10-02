import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getNewsletterSubscribers(limit = 100) {
  const supabase = createAdminClient();
  const { data, error, count } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, subscribed_at, is_active", { count: "exact" })
    .order("subscribed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Could not load newsletter subscribers.");
  return { subscribers: data || [], totalCount: count || 0 };
}