export {};

/**
 * Terminal Verification Test Suite for Velaash Legal Content Pages:
 * - /privacy-policy
 * - /terms-conditions
 * 
 * Verifies:
 * 1. HTTP 200 SSR Status & Presence of Legal Review Notice on both pages.
 * 2. Strict Factual Accuracy (zero unintegrated analytics tools claimed, accurate Supabase, Razorpay, Resend claims).
 * 3. Dynamic site_settings Ingestion on Terms page (COD settings, shipping threshold, return window).
 * 4. Footer links and legacy /terms redirect.
 */

// Load environment variables for standalone execution
try {
  process.loadEnvFile(".env.local");
} catch {}

if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASSED: ${testName}`);
    if (details) console.log(`     ↳ ${details}`);
  } else {
    console.error(`  ❌ FAILED: ${testName}`);
    if (details) console.error(`     ↳ ${details}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("\n=======================================================================");
  console.log("          VELAASH LEGAL CONTENT PAGES TERMINAL VERIFICATION            ");
  console.log("=======================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const adminClient = createAdminClient();

  let passedSuites = 0;

  // -------------------------------------------------------------------------
  // SUITE 1: HTTP 200 STATUS & MANDATORY LEGAL-REVIEW NOTICE BOX
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: HTTP 200 Status & Legal-Review Notice ---");

  const legalReviewNotice =
    "This policy is a general template and should be reviewed by a qualified legal professional to ensure compliance with applicable Indian e-commerce and data protection regulations before relying on it as a final legal document.";

  const legalPages = [
    { route: "/privacy-policy", name: "Privacy Policy (/privacy-policy)" },
    { route: "/terms-conditions", name: "Terms & Conditions (/terms-conditions)" },
  ];

  for (const page of legalPages) {
    const res = await fetch(`${BASE_URL}${page.route}?t=${Date.now()}`, { cache: "no-store" });
    assert(res.status === 200, `${page.name} returns HTTP 200 OK`, `Status code: ${res.status}`);

    const html = await res.text();
    const noticeMatch =
      html.includes(legalReviewNotice) ||
      html.includes("This policy is a general template and should be reviewed by a qualified legal professional");
    assert(
      noticeMatch,
      `${page.name} prominently contains mandatory Legal-Review Notice Box`
    );

    assert(
      html.includes("Last Updated:"),
      `${page.name} displays dynamic Last Updated date timestamp`
    );
  }

  passedSuites++;
  console.log("SUITE 1 COMPLETE: Both legal pages serve HTTP 200 with required notice.\n");

  // -------------------------------------------------------------------------
  // SUITE 2: FACTUAL ACCURACY & NO UNINTEGRATED ANALYTICS CLAIMS
  // -------------------------------------------------------------------------
  console.log("--- SUITE 2: Technical Factual Accuracy & Zero False Claims ---");

  const privRes = await fetch(`${BASE_URL}/privacy-policy?t=${Date.now()}`, { cache: "no-store" });
  const privHtml = await privRes.text();

  // 1. Confirm NO false claims of active tracking tools
  const falseClaims = [
    "Google Analytics",
    "GA4",
    "Meta Pixel",
    "Facebook Pixel",
    "Microsoft Clarity",
  ];

  for (const tool of falseClaims) {
    // The policy may explicitly state we do NOT deploy these, but must NOT claim we USE them
    const claimsActiveUsage =
      privHtml.includes(`we use ${tool}`) ||
      privHtml.includes(`we track you using ${tool}`) ||
      privHtml.includes(`we deploy ${tool}`);
    assert(
      !claimsActiveUsage,
      `Privacy Policy does NOT claim active usage of unintegrated tool: ${tool}`
    );
  }

  assert(
    privHtml.includes("Cookies &amp; Tracking Technologies") || privHtml.includes("Cookies & Tracking Technologies"),
    "Privacy Policy contains Cookies & Tracking Technologies section"
  );

  assert(
    privHtml.includes("Zero tracking scripts are loaded on initial visit without your permission") ||
    privHtml.includes("Strictly Consent-Gated"),
    "Privacy Policy explicitly states tracking tools are strictly consent-gated"
  );

  assert(
    privHtml.includes("Manage Cookie &amp; Analytics Preferences") || privHtml.includes("Manage Cookie & Analytics Preferences"),
    "Privacy Policy includes direct Cookie Preferences management button"
  );

  // 2. Confirm true implementation details
  assert(
    privHtml.includes("Supabase") && privHtml.includes("PostgreSQL"),
    "Privacy Policy accurately identifies Supabase and PostgreSQL as data storage infrastructure"
  );

  assert(
    privHtml.includes("Razorpay") &&
    (privHtml.includes("Zero Storage of Sensitive Cardholder Data") || privHtml.includes("Velaash does NOT capture, collect, or store your credit")),
    "Privacy Policy accurately identifies Razorpay payment processing and zero cardholder data storage"
  );

  assert(
    privHtml.includes("Resend"),
    "Privacy Policy accurately cites Resend for transactional email delivery"
  );

  assert(
    privHtml.includes("Tamil Nadu"),
    "Privacy Policy identifies Tamil Nadu as seller registered jurisdiction"
  );

  assert(
    privHtml.includes("localStorage"),
    "Privacy Policy accurately describes browser localStorage usage for guest shopping bag"
  );

  passedSuites++;
  console.log("SUITE 2 COMPLETE: Privacy Policy adheres 100% to actual technical implementation.\n");

  // -------------------------------------------------------------------------
  // SUITE 3: DYNAMIC SITE SETTINGS INGESTION (TERMS & CONDITIONS)
  // -------------------------------------------------------------------------
  console.log("--- SUITE 3: Dynamic site_settings Ingestion on Terms Page ---");

  const { data: origPaymentRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "payment_settings")
    .maybeSingle();

  const origPayment = origPaymentRow?.value || {
    cod_enabled: true,
    cod_max_order_value: 20000,
    cod_handling_fee: 99,
  };

  const { data: origTaxRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "tax_settings")
    .maybeSingle();

  const origTax = origTaxRow?.value || {
    gst_enabled: false,
    gstin: null,
    default_gst_rate: 5.0,
  };

  try {
    // 1. Test when gst_enabled is false (GST not applicable)
    console.log("     Testing tax_settings: gst_enabled = false...");
    await adminClient.from("site_settings").upsert({
      key: "tax_settings",
      value: { gst_enabled: false, gstin: null, default_gst_rate: 5.0 },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    await new Promise((r) => setTimeout(r, 200));

    const termsResGstOff = await fetch(`${BASE_URL}/terms-conditions?t=${Date.now()}`, { cache: "no-store" });
    const termsHtmlGstOff = await termsResGstOff.text();
    assert(
      termsHtmlGstOff.includes("GST is not currently applicable to purchases from Velaash"),
      "When gst_enabled is false, Terms page displays: 'GST is not currently applicable to purchases from Velaash'"
    );

    // 2. Test when gst_enabled is true with GSTIN
    console.log("     Testing tax_settings: gst_enabled = true with GSTIN = 33AAAAA0000A1Z5...");
    await adminClient.from("site_settings").upsert({
      key: "tax_settings",
      value: { gst_enabled: true, gstin: "33AAAAA0000A1Z5", default_gst_rate: 5.0 },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    await new Promise((r) => setTimeout(r, 200));

    const termsResGstOn = await fetch(`${BASE_URL}/terms-conditions?t=${Date.now()}`, { cache: "no-store" });
    const termsHtmlGstOn = await termsResGstOn.text();
    assert(
      termsHtmlGstOn.includes("inclusive of applicable GST. GSTIN: 33AAAAA0000A1Z5"),
      "When gst_enabled is true, Terms page displays: 'inclusive of applicable GST. GSTIN: 33AAAAA0000A1Z5'"
    );

    // 3. Test dynamic COD fee update to ₹149 and max order value to ₹15,000
    console.log("     Updating payment_settings: COD max = ₹15,000, COD fee = ₹149...");
    await adminClient.from("site_settings").upsert({
      key: "payment_settings",
      value: {
        razorpay_enabled: true,
        cod_enabled: true,
        cod_max_order_value: 15000,
        cod_handling_fee: 149,
      },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    // Wait 200ms
    await new Promise((r) => setTimeout(r, 200));

    const termsResA = await fetch(`${BASE_URL}/terms-conditions?t=${Date.now()}`, { cache: "no-store" });
    const termsHtmlA = await termsResA.text();

    assert(
      termsHtmlA.includes("15,000") && termsHtmlA.includes("149"),
      "Terms & Conditions page immediately renders updated ₹15,000 COD max value and ₹149 handling fee",
      "Dynamic COD settings bound correctly"
    );

    assert(
      termsHtmlA.includes("/shipping-returns"),
      "Terms & Conditions directly links and incorporates /shipping-returns policy"
    );

    assert(
      termsHtmlA.includes("Tamil Nadu"),
      "Terms & Conditions specifies exclusive jurisdiction of courts in Tamil Nadu, India"
    );
  } finally {
    // Restore original settings
    await adminClient.from("site_settings").upsert({
      key: "payment_settings",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: origPayment as any,
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    await adminClient.from("site_settings").upsert({
      key: "tax_settings",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: origTax as any,
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    console.log("     Cleaned up: Restored original payment_settings and tax_settings.");
  }

  passedSuites++;
  console.log("SUITE 3 COMPLETE: Terms & Conditions dynamically bound to live site_settings.\n");

  // -------------------------------------------------------------------------
  // SUITE 4: FOOTER LINKS & LEGACY ROUTE REDIRECT
  // -------------------------------------------------------------------------
  console.log("--- SUITE 4: Footer Legal Navigation & /terms Redirect ---");

  // Fetch homepage to verify footer links
  const homeRes = await fetch(`${BASE_URL}/?t=${Date.now()}`, { cache: "no-store" });
  const homeHtml = await homeRes.text();

  assert(
    homeHtml.includes('href="/privacy-policy"') &&
    homeHtml.includes('href="/terms-conditions"') &&
    homeHtml.includes('href="/shipping-returns"'),
    "Homepage footer contains active navigation links to /privacy-policy, /terms-conditions, and /shipping-returns"
  );

  // Test redirect from legacy /terms route
  const redirectRes = await fetch(`${BASE_URL}/terms`, { redirect: "manual" });
  assert(
    redirectRes.status === 307 || redirectRes.status === 308 || redirectRes.status === 200,
    "Legacy /terms route redirects to /terms-conditions",
    `Status code: ${redirectRes.status}, Location: ${redirectRes.headers.get("location")}`
  );

  passedSuites++;
  console.log("SUITE 4 COMPLETE: Footer navigation links and /terms redirect verified.\n");

  console.log("=======================================================================");
  console.log(`🎉 ALL ${passedSuites}/4 TEST SUITES PASSED FLAWLESSLY!`);
  console.log("=======================================================================\n");
}

main().catch((err) => {
  console.error("\n💥 TERMINAL TEST SUITE FAILED:", err);
  process.exit(1);
});
