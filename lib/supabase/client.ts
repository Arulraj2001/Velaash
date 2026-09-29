import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Creates a browser-side Supabase client singleton instance.
 * Used inside Client Components, client hooks, and event handlers.
 */
export function createClient(): SupabaseClient<Database> {
  const client = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return client as unknown as SupabaseClient<Database>;
}
