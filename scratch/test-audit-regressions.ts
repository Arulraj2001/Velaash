import { readFile } from "node:fs/promises";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAnalyticsScriptProviders } from "../features/analytics/utils/consent";
import { getStoreContact } from "../features/settings/utils/store-contact";
import { persistNewsletterSubscription } from "../features/newsletter/services/subscribe-newsletter";
import type { Database } from "../types/database.types";
import type { StoreProfileSetting } from "../features/settings/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Environment values may already be loaded by the test runner.
}

if (typeof globalThis.WebSocket === "undefined") {
  Object.defineProperty(globalThis, "WebSocket", {
    value: class TestWebSocket {
      addEventListener() {}
      removeEventListener() {}
      close() {}
      send() {}
    },
  });
}

let total = 0;
let passed = 0;

function assert(condition: boolean, label: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}`);
    process.exitCode = 1;
  }
}

async function run() {
  const configuredIds = {
    ga4: "configured-ga-key",
    meta_pixel: "configured-pixel-key",
    clarity: "configured-clarity-key",
  };
  const adminPaths = ["/admin", "/admin/settings", "/admin/orders/123"];
  const consentStates = ["all", "essential", null] as const;
  const adminProviders = adminPaths.flatMap((pathname) =>
    consentStates.flatMap((consent) =>
      getAnalyticsScriptProviders(consent, true, pathname, configuredIds)
    )
  );
  assert(adminProviders.length === 0, "No analytics providers are enabled on any tested admin route or consent state");

  const noClarity = getAnalyticsScriptProviders("all", true, "/", {
    ga4: "",
    meta_pixel: "",
    clarity: undefined,
  });
  assert(noClarity.length === 0, "Clarity is not enabled with all consent when its env ID is unset");

  const confirmationPage = await readFile(
    "app/order-confirmation/[orderNumber]/page.tsx",
    "utf8"
  );
  assert(
    confirmationPage.includes("href={`mailto:${storeProfile.email}`}") &&
      confirmationPage.includes("{storeProfile.email}"),
    "Order confirmation renders its support email from store_profile"
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error("Supabase URL, anon key, and service role key are required for the live checks.");
  }

  const publicClient = createSupabaseClient<Database>(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profileRow, error: profileError } = await publicClient
    .from("site_settings")
    .select("value")
    .eq("key", "store_profile")
    .single();
  const profile = profileRow?.value as Partial<StoreProfileSetting> | undefined;
  assert(!profileError && Boolean(profile?.email), "Read live store_profile contact email from site_settings");
  if (profile?.email) {
    assert(
      getStoreContact(profile as StoreProfileSetting).email === profile.email,
      "Resolved order-support email matches live site_settings email"
    );
  }

  const testEmail = `newsletter-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  let testRowCreated = false;
  try {
    const firstSubscription = await persistNewsletterSubscription(publicClient, testEmail);
    assert(
      firstSubscription.success && !firstSubscription.alreadySubscribed,
      "Anonymous newsletter signup inserts a new subscriber"
    );
    if (!firstSubscription.success) {
      console.error("[BLOCKED] Apply the newsletter migration before running the live signup checks.");
      return;
    }
    testRowCreated = true;

    const duplicateSubscription = await persistNewsletterSubscription(
      publicClient,
      testEmail.toUpperCase()
    );
    assert(
      duplicateSubscription.success && duplicateSubscription.alreadySubscribed,
      "Duplicate case-insensitive email is handled as success"
    );

    const { count, error: verifyError } = await adminClient
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("email", testEmail);
    assert(!verifyError && count === 1, "Exactly one database row exists for the test subscriber");

    const { error: publicReadError } = await publicClient
      .from("newsletter_subscribers")
      .select("email")
      .eq("email", testEmail);
    assert(Boolean(publicReadError), "Anonymous clients cannot read the subscriber list");
  } finally {
    if (testRowCreated) {
      const { error: cleanupError } = await adminClient
        .from("newsletter_subscribers")
        .delete()
        .eq("email", testEmail);
      if (cleanupError) {
        console.error("Could not clean up newsletter audit row:", cleanupError.message);
        process.exitCode = 1;
      }
    }
  }

  console.log(`\n${passed}/${total} audit regression checks passed.`);
}

run().catch((error) => {
  console.error("Audit regression test could not complete:", error);
  process.exitCode = 1;
});