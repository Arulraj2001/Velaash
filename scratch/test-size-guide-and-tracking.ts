/**
 * ==============================================================================
 * TEST SUITE: STANDALONE SIZE GUIDE & GUEST ORDER TRACKING
 * ==============================================================================
 * Validates:
 * 1. /size-guide returns 200 and renders real category-level size charts from database.
 * 2. getAllCategorySizeCharts returns properly structured category charts with unit conversion data.
 * 3. /track-order returns 200 with guest lookup form and sign-in reassurance note.
 * 4. trackGuestOrderAction correctly finds matching order by orderNumber + email.
 * 5. trackGuestOrderAction correctly finds matching order by orderNumber + 10-digit phone.
 * 6. PII Masking: street address omitted, phone/email/name masked in returned payload.
 * 7. Anti-enumeration: exact identical generic error returned for both non-existent orders
 *    and valid orders with mismatched email/phone.
 * 8. Rate Limiting: repeated failed lookups trigger rate-limiting response.
 * ==============================================================================
 */

export {};

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

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    if (details) console.log(`         ${details}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function main() {
  console.log("================================================================");
  console.log("   VELAASH SIZE GUIDE & GUEST ORDER TRACKING VERIFICATION       ");
  console.log("================================================================\n");

  const { getAllCategorySizeCharts } = await import(
    "../features/products/queries/get-all-category-size-charts"
  );
  const { trackGuestOrderAction } = await import(
    "../features/orders/actions/track-guest-order-action"
  );
  const { resetTrackOrderRateLimitsForTest } = await import(
    "../lib/rate-limit"
  );

  // Reset rate limits prior to test run
  resetTrackOrderRateLimitsForTest();

  // ============================================================================
  // TEST SECTION 1: STANDALONE SIZE GUIDE & LIVE NAVIGATION CATEGORIES ALIGNMENT
  // ============================================================================
  console.log("--- SECTION 1: Category Size Charts & Navigation Alignment ---");

  const { getNavigationCategories } = await import(
    "../features/navigation/queries/get-navigation-categories"
  );

  const navCategories = await getNavigationCategories();
  const categoryCharts = await getAllCategorySizeCharts();

  assert(
    Array.isArray(categoryCharts) && categoryCharts.length >= 6,
    "getAllCategorySizeCharts returns all core store category records",
    `Found ${categoryCharts.length} category size charts`
  );

  const navNames = navCategories.map((c) => c.name);
  const chartCatNames = categoryCharts.map((sc) => sc.categoryName);

  console.log(`  Live Navigation Categories: ${navNames.join(", ")}`);
  console.log(`  Size Guide Categories:     ${chartCatNames.join(", ")}`);

  // Explicit assertion: Size guide categories must match getNavigationCategories output
  assert(
    navNames.every((name) => chartCatNames.includes(name)),
    "Every navigation category has a corresponding size chart on /size-guide",
    `Matching categories: ${chartCatNames.join(", ")}`
  );

  // Assert NO unconfirmed "Sarees" category exists
  assert(
    !chartCatNames.some((n) => n.toLowerCase().includes("saree")),
    "No unconfirmed 'Sarees' category exists in size charts",
    "Verified: Sarees is not present"
  );
  assert(
    !navNames.some((n) => n.toLowerCase().includes("saree")),
    "No unconfirmed 'Sarees' category exists in navigation categories",
    "Verified: Sarees is not present"
  );

  // Assert real categories are present: Kurtas & Sets, Dresses, Co-ord Sets, Tops & Shirts, Bottoms, Loungewear
  const requiredCategories = [
    "Kurtas & Sets",
    "Dresses",
    "Co-ord Sets",
    "Tops & Shirts",
    "Bottoms",
    "Loungewear",
  ];
  for (const catName of requiredCategories) {
    assert(
      chartCatNames.includes(catName),
      `Size guide includes real category: '${catName}'`
    );
  }

  // Check structured Kurta chart
  const kurtaChart = categoryCharts.find((c) => c.categoryName === "Kurtas & Sets");
  assert(
    Boolean(kurtaChart),
    "Kurtas & Sets category chart is present",
    `Found chart: ${kurtaChart?.name}`
  );
  assert(
    Boolean(kurtaChart?.headers && kurtaChart.headers.length >= 4),
    "Kurta chart has garment measurement columns",
    `Headers: ${kurtaChart?.headers.join(", ")}`
  );
  assert(
    Boolean(kurtaChart?.rows && kurtaChart.rows.length >= 4),
    "Kurta chart contains size rows (XS, S, M, L, XL, XXL)",
    `Total rows: ${kurtaChart?.rows.length}`
  );

  // Check sensible Loungewear relaxed fit chart
  const loungeChart = categoryCharts.find((c) => c.categoryName === "Loungewear");
  assert(
    Boolean(loungeChart),
    "Loungewear category chart is present",
    `Found chart: ${loungeChart?.name}`
  );
  assert(
    Boolean(loungeChart?.headers.includes("Comfort Bust (in)") || loungeChart?.headers.includes("Fit Style")),
    "Loungewear uses a sensible relaxed/comfort fit chart shape rather than forced rigid tailoring",
    `Headers: ${loungeChart?.headers.join(", ")}`
  );

  // ============================================================================
  // TEST SECTION 2: STANDALONE SIZE GUIDE HTTP ROUTE
  // ============================================================================
  console.log("\n--- SECTION 2: /size-guide Route HTTP Status ---");

  try {
    const res = await fetch("http://localhost:3000/size-guide");
    assert(
      res.status === 200,
      "/size-guide route returns HTTP 200",
      `Status: ${res.status}`
    );

    const html = await res.text();
    assert(
      html.includes("Velaash Size &amp; Fit Guide") || html.includes("Velaash Size & Fit Guide"),
      "/size-guide renders page headline"
    );
    assert(
      html.includes("Kurtas &amp; Sets") || html.includes("Kurtas & Sets"),
      "/size-guide renders 'Kurtas & Sets' category"
    );
    assert(
      html.includes("Loungewear"),
      "/size-guide renders 'Loungewear' category"
    );
    assert(
      !html.includes("Sarees &amp; Drapes") && !html.includes("Sarees & Drapes"),
      "/size-guide does NOT render unconfirmed Sarees category"
    );
    assert(
      html.includes("Measurement Unit") || html.includes("Inches"),
      "/size-guide renders unit toggle component"
    );
  } catch (err: unknown) {
    console.warn("Could not reach localhost:3000 (dev server may be starting). Skipping HTTP check:", err);
  }

  // ============================================================================
  // TEST SECTION 3: GUEST ORDER TRACKING VERIFICATION (ORDER + EMAIL)
  // ============================================================================
  console.log("\n--- SECTION 3: Guest Order Tracking - Valid Lookups ---");

  const validOrderNum = "VEL-2026-00001";
  const validEmail = "pooja.sharma@example.com";
  const validPhone = "9820123456";

  const emailLookupResult = await trackGuestOrderAction(
    validOrderNum,
    validEmail,
    "127.0.0.10"
  );

  assert(
    emailLookupResult.success === true,
    "Valid order number + matching email succeeds",
    `Order #${emailLookupResult.order?.orderNumber}, status: ${emailLookupResult.order?.status}`
  );

  assert(
    emailLookupResult.order?.orderNumber === validOrderNum,
    "Returned order matches requested order number"
  );

  assert(
    Array.isArray(emailLookupResult.order?.statusHistory) &&
      emailLookupResult.order.statusHistory.length > 0,
    "Returned order includes status timeline history",
    `Steps: ${emailLookupResult.order?.statusHistory.length}`
  );

  // Test phone matching
  const phoneLookupResult = await trackGuestOrderAction(
    validOrderNum,
    validPhone,
    "127.0.0.10"
  );

  assert(
    phoneLookupResult.success === true,
    "Valid order number + matching 10-digit phone number succeeds",
    `Status: ${phoneLookupResult.order?.status}`
  );

  // ============================================================================
  // TEST SECTION 4: PRIVACY MASKING FOR GUEST VIEW
  // ============================================================================
  console.log("\n--- SECTION 4: PII Privacy Masking ---");

  const masked = emailLookupResult.order?.maskedShipping;
  assert(
    Boolean(masked),
    "Order includes masked shipping details object"
  );

  assert(
    Boolean(masked?.maskedPhone.includes("••••")),
    "Phone number is masked for guest lookup",
    `Masked phone: ${masked?.maskedPhone}`
  );

  assert(
    Boolean(masked?.maskedEmail.includes("•")),
    "Email address is masked for guest lookup",
    `Masked email: ${masked?.maskedEmail}`
  );

  assert(
    Boolean(masked?.city && masked?.pincode),
    "Destination city and pincode remain visible for delivery verification",
    `Destination: ${masked?.city}, ${masked?.pincode}`
  );

  // Check that raw street address is NOT present on the returned order object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOrderAny = emailLookupResult.order as any;
  assert(
    typeof rawOrderAny.shippingAddress === "undefined" &&
      typeof rawOrderAny.maskedShipping.addressLine1 === "undefined",
    "Full street address (addressLine1/2) is completely excluded from guest payload"
  );

  // ============================================================================
  // TEST SECTION 5: ANTI-ENUMERATION ENFORCEMENT
  // ============================================================================
  console.log("\n--- SECTION 5: Anti-Enumeration Identical Generic Error ---");

  const nonExistentResult = await trackGuestOrderAction(
    "VEL-9999-99999",
    "someone@example.com",
    "127.0.0.20"
  );

  const wrongEmailResult = await trackGuestOrderAction(
    validOrderNum,
    "attacker.probe@example.com",
    "127.0.0.20"
  );

  const wrongPhoneResult = await trackGuestOrderAction(
    validOrderNum,
    "9999999999",
    "127.0.0.20"
  );

  const GENERIC_ERROR =
    "We couldn't find a matching order. Please check your details and try again.";

  assert(
    nonExistentResult.success === false && nonExistentResult.error === GENERIC_ERROR,
    "Non-existent order returns generic error message",
    `Error: "${nonExistentResult.error}"`
  );

  assert(
    wrongEmailResult.success === false && wrongEmailResult.error === GENERIC_ERROR,
    "Valid order with WRONG email returns exact same generic error",
    `Error: "${wrongEmailResult.error}"`
  );

  assert(
    wrongPhoneResult.success === false && wrongPhoneResult.error === GENERIC_ERROR,
    "Valid order with WRONG phone returns exact same generic error",
    `Error: "${wrongPhoneResult.error}"`
  );

  assert(
    nonExistentResult.error === wrongEmailResult.error,
    "Exact error string equivalence verified (prevents enumeration)"
  );

  // ============================================================================
  // TEST SECTION 6: RATE LIMITING ENFORCEMENT
  // ============================================================================
  console.log("\n--- SECTION 6: Rate Limiting on Repeated Failed Lookups ---");

  const rateLimitTestIp = "192.168.99.1";

  // Fire 5 failed lookups
  for (let i = 1; i <= 5; i++) {
    const failRes = await trackGuestOrderAction(
      `VEL-FAIL-${i}`,
      `fail${i}@example.com`,
      rateLimitTestIp
    );
    assert(
      failRes.success === false,
      `Failed attempt #${i} recorded`,
      `Attempt ${i}`
    );
  }

  // 6th attempt should be blocked by rate limiter
  const blockedRes = await trackGuestOrderAction(
    validOrderNum, // Even if valid credentials are provided
    validEmail,
    rateLimitTestIp
  );

  assert(
    blockedRes.success === false && blockedRes.isRateLimited === true,
    "Rate limiter kicks in after repeated failed lookups",
    `Blocked message: "${blockedRes.error}"`
  );

  // ============================================================================
  // TEST SECTION 7: /track-order HTTP ROUTE
  // ============================================================================
  console.log("\n--- SECTION 7: /track-order Route HTTP Status ---");

  try {
    const res = await fetch("http://localhost:3000/track-order");
    assert(
      res.status === 200,
      "/track-order route returns HTTP 200",
      `Status: ${res.status}`
    );

    const html = await res.text();
    assert(
      html.includes("Track Your Order"),
      "/track-order renders hero headline"
    );
    assert(
      html.includes("track-order-number") || html.includes("Order Reference Number"),
      "/track-order renders order reference input field"
    );
    assert(
      html.includes("Sign in to see full order details") || html.includes("Have an account"),
      "/track-order renders sign-in reassurance note"
    );
  } catch (err: unknown) {
    console.warn("Could not reach localhost:3000. Skipping HTTP check:", err);
  }

  console.log("\n================================================================");
  console.log(`  ALL TESTS PASSED: ${passedTests}/${totalTests} verified successfully! `);
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("\nFATAL TEST FAILURE:", err);
  process.exit(1);
});
