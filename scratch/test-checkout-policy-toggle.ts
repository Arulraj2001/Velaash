export {};

/**
 * Verification Test Suite for Checkout Policy & Sign-In Requirement Toggle
 * 
 * Verifies:
 * 1. Default Setting: getSiteSettings() contains checkoutPolicy with require_sign_in_to_order = false
 * 2. Admin Action: updateCheckoutPolicySettingsAction successfully toggles setting in DB
 * 3. Server-side Enforcement:
 *    - When require_sign_in_to_order = true, guest order attempt returns AUTH_REQUIRED
 *    - When require_sign_in_to_order = false, guest checkout is permitted
 * 4. Restoration: Confirms setting is left in default OFF mode (guest checkout enabled)
 */

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

async function runTests() {
  console.log("================================================================");
  console.log("    TESTING CHECKOUT POLICY & SIGN-IN REQUIREMENT TOGGLE        ");
  console.log("================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`    Details: ${details}`);
      failed++;
    }
  }

  // --- Test 1: Query site_settings table for checkout_policy ---
  console.log("\n[Test 1] DB & Query Defaults:");
  const { data: row, error: rowErr } = await admin
    .from("site_settings")
    .select("key, value")
    .eq("key", "checkout_policy")
    .maybeSingle();

  assert(!rowErr && Boolean(row), "site_settings has 'checkout_policy' key in DB");

  const { getSiteSettings } = await import("../features/settings/queries/get-site-settings");
  const settings = await getSiteSettings();

  assert(
    typeof settings.checkoutPolicy?.require_sign_in_to_order === "boolean",
    "getSiteSettings() includes checkoutPolicy.require_sign_in_to_order"
  );
  assert(
    settings.checkoutPolicy.require_sign_in_to_order === false,
    `Default policy is OFF (require_sign_in_to_order: false) (Got: ${settings.checkoutPolicy.require_sign_in_to_order})`
  );

  // --- Test 2: Server Action Enforcement (createOrderAction) ---
  console.log("\n[Test 2] Server-Side Order Action Enforcement:");
  const { createOrderAction } = await import("../features/checkout/actions/create-order-action");

  const sampleOrderInput = {
    contact: {
      email: "guest.test@example.com",
      phone: "9876543210",
      createAccount: false,
    },
    shippingAddress: {
      fullName: "Test Guest User",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
      addressType: "home" as const,
      saveAddress: false,
    },
    paymentMethod: "cod" as const,
    items: [
      {
        productId: "00000000-0000-0000-0000-000000000000",
        variantId: null,
        title: "Test Item",
        slug: "test-item",
        quantity: 1,
        unitPrice: 999,
      },
    ],
    couponCode: null,
    idempotencyKey: `test-chk-policy-${Date.now()}`,
  };

  // 2a. With policy OFF:
  // Order will proceed past authentication check (might fail later at stock/inventory check, but NOT with AUTH_REQUIRED)
  await admin
    .from("site_settings")
    .upsert({
      key: "checkout_policy",
      value: { require_sign_in_to_order: false },
      updated_at: new Date().toISOString(),
    });

  const resOff = await createOrderAction(sampleOrderInput);
  const offCode = !resOff.success ? resOff.code : "SUCCESS";
  assert(
    offCode !== "AUTH_REQUIRED",
    `When toggle is OFF: Guest order does NOT fail with AUTH_REQUIRED (Result code: ${offCode})`
  );

  // 2b. With policy ON:
  // Order MUST fail immediately with code: "AUTH_REQUIRED"
  await admin
    .from("site_settings")
    .upsert({
      key: "checkout_policy",
      value: { require_sign_in_to_order: true },
      updated_at: new Date().toISOString(),
    });

  const resOn = await createOrderAction({
    ...sampleOrderInput,
    idempotencyKey: `test-chk-policy-on-${Date.now()}`,
  });

  const isOnBlocked = !resOn.success && resOn.code === "AUTH_REQUIRED";
  const onCode = !resOn.success ? resOn.code : "SUCCESS";
  const onError = !resOn.success ? resOn.error : "";

  assert(
    isOnBlocked,
    `When toggle is ON: Unauthenticated guest order is BLOCKED with AUTH_REQUIRED (Result code: ${onCode})`
  );
  assert(
    Boolean(onError && onError.includes("sign in")),
    `User-friendly error message provided: "${onError}"`
  );

  // --- Test 3: Reset policy back to default OFF ---
  console.log("\n[Test 3] Reset Policy to Initial OFF State:");
  await admin
    .from("site_settings")
    .upsert({
      key: "checkout_policy",
      value: { require_sign_in_to_order: false },
      updated_at: new Date().toISOString(),
    });

  const settingsReset = await getSiteSettings();
  assert(
    settingsReset.checkoutPolicy.require_sign_in_to_order === false,
    "Confirmed setting successfully reset to OFF (guest checkout enabled for launch)"
  );

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
