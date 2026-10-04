/**
 * ==============================================================================
 * ⚠️ SECURITY CRITICAL: ELEVATED SUPABASE SERVICE-ROLE ADMIN CLIENT ⚠️
 * ==============================================================================
 *
 * THIS CLIENT USES THE ELEVATED `SUPABASE_SERVICE_ROLE_KEY` WHICH BYPASSES
 * ALL ROW LEVEL SECURITY (RLS) POLICIES IN POSTGRESQL.
 *
 * STRICT POLICIES FOR USAGE:
 * 1. SERVER-ONLY: This file and function MUST NEVER be imported into or bundled
 *    with any client-side code ('use client' files, browser bundles, public components).
 * 2. JUSTIFICATION REQUIRED: This client must ONLY be used for operations that
 *    strictly require bypassing RLS (e.g. guest checkout order insertion, variant
 *    stock decrements where public users lack direct UPDATE permissions, webhooks).
 *    ANY CALL SITE USING THIS CLIENT MUST INCLUDE AN EXPLICIT COMMENT JUSTIFYING
 *    WHY RLS MUST BE BYPASSED.
 * 3. NEVER TRUST CLIENT INPUT: Always validate payloads with Zod schemas and
 *    re-derive authoritative prices, totals, and user IDs from trusted server state
 *    before executing mutations with this client.
 * 4. NEVER EXPOSE TO EXTERNAL CALLERS: Never return the client instance or raw
 *    unrestricted database queries to the client.
 * ==============================================================================
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

// Runtime defense: immediately throw if bundled or imported in client/browser context
if (typeof window !== "undefined") {
  throw new Error(
    "SECURITY VIOLATION: lib/supabase/admin.ts was imported in a browser environment. " +
      "The service-role client is strictly server-only and must never reach client bundles."
  );
}

// Provide dummy WebSocket constructor if running in Node < 22 so @supabase/realtime-js does not throw
if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

/**
 * Creates an elevated Supabase client for server actions and trusted backend mutations.
 * Bypasses Row Level Security when SUPABASE_SERVICE_ROLE_KEY is provided.
 *
 * IMPORTANT: Every caller of this function MUST document with a code comment
 * why bypassing RLS is strictly required for that specific operation.
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: createAdminClient() was called in a browser environment. " +
        "The service-role client is strictly server-only and must never reach client bundles."
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn(
      "WARNING: SUPABASE_SERVICE_ROLE_KEY is missing in runtime environment. Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  // Fallback to anon key when service role key is not configured
  const key = serviceRoleKey || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

