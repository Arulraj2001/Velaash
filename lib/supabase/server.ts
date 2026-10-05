import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Creates a server-side Supabase client with Next.js App Router cookie handling.
 * Used inside Server Components, Route Handlers, and Server Actions.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside request context (e.g. CLI tests, worker scripts)
  }

  const client = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore!.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware is refreshing user sessions.
          }
        },
      },
    }
  );

  return client as unknown as SupabaseClient<Database>;
}

/**
 * Creates a cookie-free client for public, cached reads. Keeping these reads
 * independent of request cookies allows ISR pages to be rendered ahead of time.
 */
export function createPublicClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
