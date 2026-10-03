export {};

/**
 * Terminal Verification Test Suite for Velaash Informational Content Pages:
 * 
 * 1. HTTP 200 SSR Status: Confirms /about, /contact, /faq, and /shipping-returns all return 200 OK.
 * 2. Dynamic site_settings Integration: Confirms FAQ and Shipping & Returns pages display ACTUAL live
 *    site_settings values (free_shipping_threshold and return_window_days) and update dynamically when settings change.
 * 3. Contact Form Email Dispatch: Verifies submitContactFormAction validates inputs and dispatches email via Resend
 *    to the store's contact email with full customer payload.
 * 4. Honeypot Bot Spam Protection: Verifies bot submissions with populated honeypot field are silently dropped with
 *    zero email dispatched.
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
  console.log("       VELAASH INFORMATIONAL CONTENT PAGES TERMINAL VERIFICATION       ");
  console.log("=======================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const adminClient = createAdminClient();

  const { submitContactFormAction } = await import(
    "../features/contact/actions/submit-contact-action"
  );
  const { DISPATCHED_EMAILS_LOG } = await import("../lib/email/resend");
  const { getSiteSettings } = await import(
    "../features/settings/queries/get-site-settings"
  );

  let passedSuites = 0;

  // -------------------------------------------------------------------------
  // SUITE 1: HTTP 200 STATUS & CORE CONTENT VALIDATION FOR ALL 4 PAGES
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: HTTP 200 Status & Content Structure for All 4 Pages ---");

  const pagesToTest = [
    {
      route: "/about",
      expectedTexts: [
        "Contemporary Clothing for Everyday Elegance",
        "Pan-India Delivery",
        "Store Information",
        "Operating Entity",
      ],
      name: "About Page (/about)",
    },
    {
      route: "/contact",
      expectedTexts: [
        "Contact Us",
        "Online Inquiry Form",
        "Get in Touch",
        "Instant Chat",
      ],
      name: "Contact Page (/contact)",
    },
    {
      route: "/faq",
      expectedTexts: [
        "Frequently Asked Questions",
        "Orders & Payment",
        "Shipping & Delivery",
        "Returns & Exchanges",
        "Sizing & Fit",
        "Account & Security",
      ],
      name: "FAQ Page (/faq)",
    },
    {
      route: "/shipping-returns",
      expectedTexts: [
        "Shipping & Returns Policy",
        "Shipping & Delivery Terms",
        "Returns & Exchange Policy",
        "Garment Eligibility Criteria",
        "How to Initiate a Return",
      ],
      name: "Shipping & Returns Policy Page (/shipping-returns)",
    },
  ];

  for (const page of pagesToTest) {
    const res = await fetch(`${BASE_URL}${page.route}`);
    assert(
      res.status === 200,
      `${page.name} returns HTTP 200 OK`,
      `Status code: ${res.status}`
    );

    const html = await res.text();
    for (const expected of page.expectedTexts) {
      const match = html.includes(expected) || html.includes(expected.replace(/&/g, "&amp;"));
      assert(
        match,
        `${page.name} contains essential section: "${expected}"`
      );
    }
  }

  // Verify no unconfirmed operating hours exist in contact or shipping-returns pages
  const contactRes = await fetch(`${BASE_URL}/contact`);
  const contactHtml = await contactRes.text();
  assert(
    !contactHtml.includes("10:00 AM – 7:00 PM") && contactHtml.includes("typically respond within 24 hours"),
    "Contact page avoids unconfirmed operating hours and displays honest response-time expectation"
  );

  const srRes = await fetch(`${BASE_URL}/shipping-returns`);
  const srHtml = await srRes.text();
  assert(
    !srHtml.includes("10:00 AM – 7:00 PM") && srHtml.includes("typically responding within 24 hours"),
    "Shipping & Returns page avoids unconfirmed operating hours and displays honest response-time expectation"
  );

  passedSuites++;
  console.log("SUITE 1 COMPLETE: All 4 informational routes verified with HTTP 200 and proper markup.\n");

  // -------------------------------------------------------------------------
  // SUITE 2: DYNAMIC SITE SETTINGS INGESTION (FAQ & SHIPPING-RETURNS)
  // -------------------------------------------------------------------------
  console.log("--- SUITE 2: Dynamic site_settings Single Source of Truth Ingestion ---");

  // Read current settings to restore later
  const { data: origShippingRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "shipping_policy")
    .maybeSingle();

  const { data: origReturnsRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "returns_policy")
    .maybeSingle();

  const origShipping = origShippingRow?.value || {
    free_shipping_threshold: 999,
    standard_shipping_fee: 99,
  };
  const origReturns = origReturnsRow?.value || {
    return_window_days: 7,
    policy_description: "Standard domestic return policy.",
  };

  try {
    // 1. Change threshold to ₹2,499 and return window to 14 days
    console.log("     Updating settings: Free Shipping Threshold = ₹2,499, Return Window = 14 Days...");
    await adminClient.from("site_settings").upsert({
      key: "shipping_policy",
      value: { free_shipping_threshold: 2499, standard_shipping_fee: 120 },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    await adminClient.from("site_settings").upsert({
      key: "returns_policy",
      value: { return_window_days: 14, policy_description: "14-day premium return policy." },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    // Verify through getSiteSettings()
    const settingsA = await getSiteSettings();
    assert(
      settingsA.shippingPolicy.free_shipping_threshold === 2499 &&
      settingsA.returnsPolicy.return_window_days === 14,
      "getSiteSettings() returns updated values (₹2,499 threshold & 14 days)"
    );

    // Wait 200ms for Supabase replication / cache invalidation
    await new Promise((r) => setTimeout(r, 200));

    // Fetch live FAQ page HTML
    const faqResA = await fetch(`${BASE_URL}/faq?t=${Date.now()}`, { cache: "no-store" });
    const faqHtmlA = await faqResA.text();
    assert(
      faqHtmlA.includes("2,499") && faqHtmlA.includes("14-day"),
      "Live FAQ page immediately renders the updated ₹2,499 shipping threshold and 14-day return window",
      "Dynamic FAQ single source of truth confirmed"
    );

    // Fetch live Shipping & Returns page HTML
    const srResA = await fetch(`${BASE_URL}/shipping-returns?t=${Date.now()}`, { cache: "no-store" });
    const srHtmlA = await srResA.text();
    assert(
      srHtmlA.includes("2,499") && (srHtmlA.includes("14 Days") || srHtmlA.includes("14 calendar days")),
      "Live Shipping & Returns page immediately renders the updated ₹2,499 threshold and 14 Days return window",
      "Dynamic Shipping & Returns single source of truth confirmed"
    );

    // 2. Change threshold to ₹1,899 and return window to 10 days
    console.log("     Updating settings: Free Shipping Threshold = ₹1,899, Return Window = 10 Days...");
    await adminClient.from("site_settings").upsert({
      key: "shipping_policy",
      value: { free_shipping_threshold: 1899, standard_shipping_fee: 99 },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    await adminClient.from("site_settings").upsert({
      key: "returns_policy",
      value: { return_window_days: 10, policy_description: "10-day return policy." },
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    // Wait 200ms
    await new Promise((r) => setTimeout(r, 200));

    const faqResB = await fetch(`${BASE_URL}/faq?t=${Date.now()}`, { cache: "no-store" });
    const faqHtmlB = await faqResB.text();
    assert(
      faqHtmlB.includes("1,899") && faqHtmlB.includes("10-day"),
      "Live FAQ page updates dynamically when settings change to ₹1,899 and 10 days"
    );

    const srResB = await fetch(`${BASE_URL}/shipping-returns?t=${Date.now()}`, { cache: "no-store" });
    const srHtmlB = await srResB.text();
    assert(
      srHtmlB.includes("1,899") && (srHtmlB.includes("10 Days") || srHtmlB.includes("10 calendar days")),
      "Live Shipping & Returns page updates dynamically when settings change to ₹1,899 and 10 Days"
    );
  } finally {
    // Restore original settings
    await adminClient.from("site_settings").upsert({
      key: "shipping_policy",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: origShipping as any,
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    await adminClient.from("site_settings").upsert({
      key: "returns_policy",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: origReturns as any,
      is_public: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    console.log("     Cleaned up: Restored original shipping and returns settings.");
  }

  passedSuites++;
  console.log("SUITE 2 COMPLETE: Policy pages dynamically bound to live site_settings.\n");

  // -------------------------------------------------------------------------
  // SUITE 3: CONTACT FORM SUBMISSION & RESEND EMAIL DISPATCH
  // -------------------------------------------------------------------------
  console.log("--- SUITE 3: Contact Form Server Action & Email Dispatch ---");

  // Clear audit log before test
  DISPATCHED_EMAILS_LOG.length = 0;

  const validSubmission = {
    name: "Rohan Verma",
    email: "rohan.verma@example.com",
    subject: "Custom Sizing & Fabric Inquiry",
    message: "Hello Velaash team, I would like to inquire about the fabric weight of your Chanderi Kurta Set. Does it come lined with mulmul?",
  };

  const actionResult = await submitContactFormAction(validSubmission);

  assert(
    actionResult.success === true,
    "submitContactFormAction succeeds with valid customer payload",
    `Response message: "${actionResult.message}"`
  );

  assert(
    DISPATCHED_EMAILS_LOG.length === 1,
    "Transactional email dispatch was recorded in DISPATCHED_EMAILS_LOG",
    `Total emails recorded: ${DISPATCHED_EMAILS_LOG.length}`
  );

  const dispatchedEmail = DISPATCHED_EMAILS_LOG[0];
  const settings = await getSiteSettings();
  const expectedStoreEmail = settings.storeProfile.email;

  assert(
    dispatchedEmail.to === expectedStoreEmail,
    `Email dispatched to store contact email configured in site_settings (${expectedStoreEmail})`,
    `Recipient: ${dispatchedEmail.to}`
  );

  assert(
    dispatchedEmail.subject.includes("Custom Sizing & Fabric Inquiry") &&
    dispatchedEmail.subject.includes("Rohan Verma"),
    "Email subject contains customer name and submitted subject line",
    `Subject: "${dispatchedEmail.subject}"`
  );

  assert(
    Boolean(
      dispatchedEmail.text?.includes("rohan.verma@example.com") &&
      dispatchedEmail.text?.includes("Chanderi Kurta Set")
    ),
    "Email body contains sender email and customer message content"
  );

  const { render } = await import("@react-email/components");
  const emailHtml = dispatchedEmail.reactComponent
    ? await render(dispatchedEmail.reactComponent)
    : "";

  assert(
    Boolean(
      emailHtml.includes("#4D2A00") &&
      emailHtml.includes("#F2A900") &&
      !emailHtml.includes("#2C1810") &&
      !emailHtml.includes("#D4AF37")
    ),
    "Contact inquiry email strictly adheres to established Velaash brand tokens (#4D2A00, #F2A900) without invented colors",
    `Header color #4D2A00: ${emailHtml.includes("#4D2A00")}, Gold #F2A900: ${emailHtml.includes("#F2A900")}`
  );

  passedSuites++;
  console.log("SUITE 3 COMPLETE: Contact form triggers email send with correct payload.\n");

  // -------------------------------------------------------------------------
  // SUITE 4: HONEYPOT SPAM BOT PROTECTION (SILENT REJECTION)
  // -------------------------------------------------------------------------
  console.log("--- SUITE 4: Honeypot Anti-Spam Field Silent Rejection ---");

  // Clear audit log before test
  DISPATCHED_EMAILS_LOG.length = 0;

  const botSpamSubmission = {
    name: "Automated Web Bot",
    email: "bot@spammer-domain.ru",
    subject: "Buy cheap crypto backlinks now",
    message: "Increase your domain authority with cheap high PR links today!",
    // Honeypot field filled by bot crawler:
    company_website: "https://spam-seo-links-deal.com",
  };

  const spamResult = await submitContactFormAction(botSpamSubmission);

  assert(
    spamResult.success === true,
    "Honeypot trap returns synthetic success response so bots do not adapt",
    `Response message: "${spamResult.message}"`
  );

  assert(
    DISPATCHED_EMAILS_LOG.length === 0,
    "Zero emails dispatched when honeypot field is filled (bot spam dropped silently)",
    `DISPATCHED_EMAILS_LOG count: ${DISPATCHED_EMAILS_LOG.length} (Expected 0)`
  );

  // 5. Test validation rejection for invalid inputs
  const invalidSubmission = {
    name: "A", // too short (min 2)
    email: "not-an-email",
    subject: "Hi", // too short (min 3)
    message: "Short", // too short (min 10)
  };

  const invalidResult = await submitContactFormAction(invalidSubmission);

  assert(
    invalidResult.success === false && Boolean(invalidResult.fieldErrors),
    "submitContactFormAction validates and rejects malformed inputs with detailed field errors",
    `Validation error: "${invalidResult.error}"`
  );

  passedSuites++;
  console.log("SUITE 4 COMPLETE: Honeypot spam defense and Zod input validation verified.\n");

  console.log("=======================================================================");
  console.log(`🎉 ALL ${passedSuites}/4 TEST SUITES PASSED FLAWLESSLY!`);
  console.log("=======================================================================\n");
}

main().catch((err) => {
  console.error("\n💥 TERMINAL TEST SUITE FAILED:", err);
  process.exit(1);
});
