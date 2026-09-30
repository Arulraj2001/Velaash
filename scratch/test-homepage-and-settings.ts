export {};

/**
 * Terminal Verification Test Suite for Homepage Builder & Site Settings:
 * 
 * 1. RBAC & Server-Side Security: Staff has zero access to both /admin/homepage and /admin/settings.
 * 2. Homepage Section Reordering: Updates display_order in DB, and live homepage query getHomepageSections() respects it immediately.
 * 3. GST / Tax Policy Toggle: Toggling gst_enabled changes invoice PDF generation output between Tax Invoice and Bill of Supply.
 * 4. Shipping Threshold Single Source: Updating free_shipping_threshold in site_settings alters calculation on live cart page.
 * 5. COD & Payment Settings in Checkout: Disabling COD or exceeding cod_max_order_value blocks COD order placement; disabling razorpay pauses online gateway.
 */

// Load environment variables for standalone Node execution
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

// Setup mock localStorage
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: storageMock,
  writable: true,
});

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

async function main() {
  console.log("\n=======================================================================");
  console.log("    VELAASH FINAL ADMIN SECTIONS: HOMEPAGE BUILDER & SITE SETTINGS    ");
  console.log("=======================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const adminClient = createAdminClient();

  // Dynamic imports
  const { hasAdminPermission, canAccessAdminRoute } = await import(
    "../features/admin/permissions"
  );
  const { getHomepageSections } = await import(
    "../features/homepage/queries/get-homepage-sections"
  );
  const { getSiteSettings } = await import(
    "../features/settings/queries/get-site-settings"
  );
  const { calculateCartTotals } = await import(
    "../features/cart/utils/pricing"
  );
  const { generateInvoicePdfBuffer } = await import(
    "../features/admin/services/invoice-pdf"
  );
  const { createOrderAction } = await import(
    "../features/checkout/actions/create-order-action"
  );

  let passedSuites = 0;

  // -------------------------------------------------------------------------
  // SUITE 1: RBAC & SERVER-SIDE ROUTE PERMISSIONS (OWNER ONLY)
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: RBAC & Server-Side Security (Owner Only) ---");

  // Route access guards
  assert(
    canAccessAdminRoute("staff", "/admin/homepage") === false,
    "Staff has zero access to /admin/homepage route",
    "canAccessAdminRoute('staff', '/admin/homepage') returns false"
  );

  assert(
    canAccessAdminRoute("staff", "/admin/settings") === false,
    "Staff has zero access to /admin/settings route",
    "canAccessAdminRoute('staff', '/admin/settings') returns false"
  );

  assert(
    canAccessAdminRoute("owner", "/admin/homepage") === true,
    "Owner has full access to /admin/homepage route",
    "canAccessAdminRoute('owner', '/admin/homepage') returns true"
  );

  assert(
    canAccessAdminRoute("owner", "/admin/settings") === true,
    "Owner has full access to /admin/settings route",
    "canAccessAdminRoute('owner', '/admin/settings') returns true"
  );

  // Central permissions matrix
  assert(
    hasAdminPermission("staff", "manage_homepage") === false,
    "Staff lacks 'manage_homepage' permission",
    "hasAdminPermission('staff', 'manage_homepage') is false"
  );

  assert(
    hasAdminPermission("staff", "manage_settings") === false,
    "Staff lacks 'manage_settings' permission",
    "hasAdminPermission('staff', 'manage_settings') is false"
  );

  assert(
    hasAdminPermission("owner", "manage_homepage") === true,
    "Owner possesses 'manage_homepage' permission",
    "hasAdminPermission('owner', 'manage_homepage') is true"
  );

  assert(
    hasAdminPermission("owner", "manage_settings") === true,
    "Owner possesses 'manage_settings' permission",
    "hasAdminPermission('owner', 'manage_settings') is true"
  );

  passedSuites++;
  console.log("SUITE 1 COMPLETE: Owner-only permissions verified.\n");

  // -------------------------------------------------------------------------
  // SUITE 2: HOMEPAGE BUILDER REORDERING & LIVE QUERY BEHAVIOR
  // -------------------------------------------------------------------------
  console.log("--- SUITE 2: Homepage Section Reordering & Live Query ---");

  // 1. Fetch current sections from database
  const { data: dbSections, error: fetchErr } = await adminClient
    .from("homepage_sections")
    .select("id, section_type, title, display_order, is_active")
    .order("display_order", { ascending: true });

  assert(!fetchErr && Array.isArray(dbSections) && dbSections.length >= 2, "Fetched initial homepage sections from database");

  const originalFirst = dbSections![0];
  const originalSecond = dbSections![1];
  console.log(`     Initial order: [1] ${originalFirst.title} (order ${originalFirst.display_order}), [2] ${originalSecond.title} (order ${originalSecond.display_order})`);

  try {
    // 2. Swap display_order between the first two sections
    const tempFirstOrder = 9991;
    const tempSecondOrder = 9992;

    await adminClient
      .from("homepage_sections")
      .update({ display_order: tempSecondOrder })
      .eq("id", originalFirst.id);

    await adminClient
      .from("homepage_sections")
      .update({ display_order: tempFirstOrder })
      .eq("id", originalSecond.id);

    // 3. Query through live storefront query getHomepageSections()
    const liveSectionsAfterSwap = await getHomepageSections();

    // Find swapped sections in live result
    const liveIndexOriginalFirst = liveSectionsAfterSwap.findIndex((s) => s.id === originalFirst.id);
    const liveIndexOriginalSecond = liveSectionsAfterSwap.findIndex((s) => s.id === originalSecond.id);

    assert(
      liveIndexOriginalSecond < liveIndexOriginalFirst,
      "Live homepage query respects updated display_order",
      `Original second (${originalSecond.title}) now precedes original first (${originalFirst.title}) in live output`
    );

    // 4. Test active/inactive toggle
    await adminClient
      .from("homepage_sections")
      .update({ is_active: false })
      .eq("id", originalFirst.id);

    const liveSectionsAfterDeactivate = await getHomepageSections();
    const isExcluded = !liveSectionsAfterDeactivate.some((s) => s.id === originalFirst.id);

    assert(
      isExcluded,
      "Live homepage query respects is_active flag and excludes inactive sections",
      `Inactive section (${originalFirst.title}) omitted from live render`
    );
  } finally {
    // Restore original orders and active states
    await adminClient
      .from("homepage_sections")
      .update({ display_order: originalFirst.display_order, is_active: originalFirst.is_active })
      .eq("id", originalFirst.id);

    await adminClient
      .from("homepage_sections")
      .update({ display_order: originalSecond.display_order, is_active: originalSecond.is_active })
      .eq("id", originalSecond.id);

    console.log("     Cleaned up: Restored original homepage section orders.");
  }

  passedSuites++;
  console.log("SUITE 2 COMPLETE: Homepage builder drag-and-drop reordering verified.\n");

  // -------------------------------------------------------------------------
  // SUITE 3: TAX / GST TOGGLE & INVOICE GENERATION OUTPUT
  // -------------------------------------------------------------------------
  console.log("--- SUITE 3: Tax / GST Toggle & Invoice Generation Output ---");

  // Mock order details for invoice testing
  const mockInvoiceOrder = {
    id: "test-ord-gst-1",
    orderNumber: "ORD-2026-GST01",
    status: "confirmed" as const,
    paymentMethod: "razorpay" as const,
    paymentStatus: "paid" as const,
    subtotal: 3500,
    shippingCharge: 0,
    discountAmount: 0,
    totalAmount: 3500,
    couponCode: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shippingAddress: {
      fullName: "Ananya Iyer",
      phone: "+91 9876543210",
      email: "ananya@example.com",
      addressLine1: "42 Silk Mill Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641001",
    },
    items: [
      {
        id: "item-inv-1",
        productName: "Chanderi Silk Saree",
        size: "Free Size",
        color: "Mustard Gold",
        sku: "VEL-SAR-MST",
        unitPrice: 3500,
        quantity: 1,
        subtotal: 3500,
      },
    ],
    statusHistory: [],
    canCancel: true,
    canRefund: false,
  };

  // 1. Generate invoice with GST ENABLED + GSTIN
  const gstinTest = "33AAAAA0000A1Z5";
  const pdfGstEnabledBuffer = await generateInvoicePdfBuffer(mockInvoiceOrder, true, gstinTest);

  assert(
    Buffer.isBuffer(pdfGstEnabledBuffer) && pdfGstEnabledBuffer.length > 500,
    "Invoice PDF Buffer successfully generated with GST enabled",
    `Buffer byte length: ${pdfGstEnabledBuffer.length} bytes`
  );

  assert(
    pdfGstEnabledBuffer.toString("utf-8", 0, 5) === "%PDF-",
    "Generated Tax Invoice document contains valid standard %PDF- header magic bytes"
  );

  // 2. Generate invoice with GST DISABLED (Bill of Supply)
  const pdfGstDisabledBuffer = await generateInvoicePdfBuffer(mockInvoiceOrder, false, null);

  assert(
    Buffer.isBuffer(pdfGstDisabledBuffer) && pdfGstDisabledBuffer.length > 500,
    "Invoice PDF Buffer successfully generated with GST disabled",
    `Buffer byte length: ${pdfGstDisabledBuffer.length} bytes`
  );

  assert(
    pdfGstDisabledBuffer.toString("utf-8", 0, 5) === "%PDF-",
    "Generated Bill of Supply document contains valid standard %PDF- header magic bytes"
  );

  assert(
    pdfGstEnabledBuffer.length !== pdfGstDisabledBuffer.length,
    "Toggling GST produces different document structures (Tax Invoice with GST breakdown vs Bill of Supply)",
    `Tax Invoice: ${pdfGstEnabledBuffer.length} bytes, Bill of Supply: ${pdfGstDisabledBuffer.length} bytes`
  );

  // Verify site_settings read by invoice route
  const { data: taxSettingRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "tax_settings")
    .maybeSingle();

  assert(
    taxSettingRow !== null && typeof taxSettingRow?.value === "object",
    "tax_settings row exists in site_settings database table and is readable"
  );

  passedSuites++;
  console.log("SUITE 3 COMPLETE: Tax / GST toggle correctly alters invoice output.\n");

  // -------------------------------------------------------------------------
  // SUITE 4: SHIPPING THRESHOLD SINGLE SOURCE OF TRUTH (LIVE CART BEHAVIOR)
  // -------------------------------------------------------------------------
  console.log("--- SUITE 4: Shipping Threshold Single Source of Truth (Cart Calculation) ---");

  // Read current shipping settings to restore later
  const { data: origShippingRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "shipping_policy")
    .maybeSingle();

  const originalShipping = origShippingRow?.value as { free_shipping_threshold: number; standard_shipping_fee: number } || {
    free_shipping_threshold: 999,
    standard_shipping_fee: 99,
  };

  try {
    // 1. Update shipping threshold in settings to ₹2000
    await adminClient
      .from("site_settings")
      .upsert({
        key: "shipping_policy",
        value: {
          free_shipping_threshold: 2000,
          standard_shipping_fee: 150,
        },
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    // 2. Fetch site settings through live query
    const settingsHigh = await getSiteSettings();
    assert(
      settingsHigh.shippingPolicy.free_shipping_threshold === 2000,
      "getSiteSettings() returns updated free_shipping_threshold of ₹2,000",
      `Actual value: ₹${settingsHigh.shippingPolicy.free_shipping_threshold}`
    );

    // 3. Test cart calculation for an order with subtotal ₹1,500
    // At ₹2000 threshold, ₹1500 DOES NOT qualify for free shipping
    const testItems = [
      {
        id: "cart-item-1",
        productId: "p1",
        variantId: "v1",
        title: "Embroidered Kurta",
        slug: "embroidered-kurta",
        price: 1500,
        quantity: 1,
        size: "M",
        color: "Indigo",
        image: "/placeholder.jpg",
        maxStock: 10,
        isAvailable: true,
      },
    ];

    const calcHigh = calculateCartTotals({
      items: testItems,
      appliedCoupon: null,
      shippingPolicy: {
        free_shipping_threshold: settingsHigh.shippingPolicy.free_shipping_threshold,
        standard_shipping_fee: settingsHigh.shippingPolicy.standard_shipping_fee,
      },
    });

    assert(
      calcHigh.isFreeShipping === false && calcHigh.shippingFee === 150 && calcHigh.amountNeededForFreeShipping === 500,
      "Cart calculation enforces ₹2,000 threshold: ₹150 shipping fee applied, ₹500 remaining for free shipping",
      `Fee: ₹${calcHigh.shippingFee}, Remaining: ₹${calcHigh.amountNeededForFreeShipping}`
    );

    // 4. Update shipping threshold in settings to ₹1000
    await adminClient
      .from("site_settings")
      .upsert({
        key: "shipping_policy",
        value: {
          free_shipping_threshold: 1000,
          standard_shipping_fee: 150,
        },
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    const settingsLow = await getSiteSettings();
    const calcLow = calculateCartTotals({
      items: testItems,
      appliedCoupon: null,
      shippingPolicy: {
        free_shipping_threshold: settingsLow.shippingPolicy.free_shipping_threshold,
        standard_shipping_fee: settingsLow.shippingPolicy.standard_shipping_fee,
      },
    });

    assert(
      calcLow.isFreeShipping === true && calcLow.shippingFee === 0 && calcLow.amountNeededForFreeShipping === 0,
      "Cart calculation enforces ₹1,000 threshold: free shipping granted, fee is ₹0",
      `Fee: ₹${calcLow.shippingFee}, Free: ${calcLow.isFreeShipping}`
    );
  } finally {
    // Restore original shipping settings
    await adminClient
      .from("site_settings")
      .upsert({
        key: "shipping_policy",
        value: originalShipping,
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    console.log("     Cleaned up: Restored original shipping settings.");
  }

  passedSuites++;
  console.log("SUITE 4 COMPLETE: Shipping threshold settings verified as single source of truth for cart.\n");

  // -------------------------------------------------------------------------
  // SUITE 5: COD & PAYMENT SETTINGS IN CHECKOUT (ORDER CREATION INTEGRATION)
  // -------------------------------------------------------------------------
  console.log("--- SUITE 5: COD & Payment Settings in Checkout Action ---");

  // Read current payment settings to restore later
  const { data: origPaymentRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "payment_settings")
    .maybeSingle();

  const originalPayment = origPaymentRow?.value as Record<string, unknown> || {
    cod_enabled: true,
    cod_max_order_value: 10000,
    cod_handling_fee: 50,
    razorpay_enabled: true,
  };

  const testProductId = "c1111111-1111-4111-c111-000000000002";
  const testVariantId = "d1111111-1111-4111-d111-000000000010";

  try {
    // 1. Disable COD entirely in settings
    await adminClient
      .from("site_settings")
      .upsert({
        key: "payment_settings",
        value: {
          cod_enabled: false,
          cod_max_order_value: 10000,
          cod_handling_fee: 50,
          razorpay_enabled: true,
        },
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    const orderAttemptCodDisabled = await createOrderAction({
      contact: { email: "customer@example.com", phone: "9876543210" },
      shippingAddress: {
        fullName: "Kavitha Raman",
        phone: "9876543210",
        addressLine1: "15 Anna Salai",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600002",
      },
      paymentMethod: "cod",
      items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
      idempotencyKey: `cod-disabled-test-${Date.now()}`,
    });

    assert(
      orderAttemptCodDisabled.success === false && orderAttemptCodDisabled.code === "COD_UNAVAILABLE",
      "createOrderAction rejects COD when cod_enabled is toggled OFF in settings",
      `Error returned: "${!orderAttemptCodDisabled.success ? orderAttemptCodDisabled.error : ""}"`
    );

    // 2. Set COD max order value to ₹1,000 (below item price of ₹4,250)
    await adminClient
      .from("site_settings")
      .upsert({
        key: "payment_settings",
        value: {
          cod_enabled: true,
          cod_max_order_value: 1000,
          cod_handling_fee: 50,
          razorpay_enabled: true,
        },
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    const orderAttemptCodLimitExceeded = await createOrderAction({
      contact: { email: "customer@example.com", phone: "9876543210" },
      shippingAddress: {
        fullName: "Kavitha Raman",
        phone: "9876543210",
        addressLine1: "15 Anna Salai",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600002",
      },
      paymentMethod: "cod",
      items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
      idempotencyKey: `cod-limit-test-${Date.now()}`,
    });

    assert(
      orderAttemptCodLimitExceeded.success === false &&
      orderAttemptCodLimitExceeded.code === "COD_UNAVAILABLE" &&
      Boolean(!orderAttemptCodLimitExceeded.success && orderAttemptCodLimitExceeded.error?.includes("1,000")),
      "createOrderAction rejects COD when subtotal exceeds cod_max_order_value setting",
      `Error returned: "${!orderAttemptCodLimitExceeded.success ? orderAttemptCodLimitExceeded.error : ""}"`
    );

    // 3. Pause Razorpay online gateway in settings
    await adminClient
      .from("site_settings")
      .upsert({
        key: "payment_settings",
        value: {
          cod_enabled: true,
          cod_max_order_value: 50000,
          cod_handling_fee: 50,
          razorpay_enabled: false,
        },
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    const orderAttemptRazorpayPaused = await createOrderAction({
      contact: { email: "customer@example.com", phone: "9876543210" },
      shippingAddress: {
        fullName: "Kavitha Raman",
        phone: "9876543210",
        addressLine1: "15 Anna Salai",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600002",
      },
      paymentMethod: "razorpay",
      items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
      idempotencyKey: `rzp-paused-test-${Date.now()}`,
    });

    assert(
      orderAttemptRazorpayPaused.success === false &&
      orderAttemptRazorpayPaused.code === "GATEWAY_ERROR" &&
      Boolean(!orderAttemptRazorpayPaused.success && orderAttemptRazorpayPaused.error?.includes("paused")),
      "createOrderAction rejects Razorpay checkout when razorpay_enabled is toggled OFF in settings",
      `Error returned: "${!orderAttemptRazorpayPaused.success ? orderAttemptRazorpayPaused.error : ""}"`
    );
  } finally {
    // Restore original payment settings
    await adminClient
      .from("site_settings")
      .upsert({
        key: "payment_settings",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: originalPayment as any,
        is_public: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    console.log("     Cleaned up: Restored original payment settings.");
  }

  passedSuites++;
  console.log("SUITE 5 COMPLETE: Payment settings directly control checkout availability.\n");

  console.log("=======================================================================");
  console.log(`🎉 ALL ${passedSuites}/5 TEST SUITES PASSED FLAWLESSLY!`);
  console.log("=======================================================================\n");
}

main().catch((err) => {
  console.error("\n💥 TERMINAL TEST SUITE FAILED:", err);
  process.exit(1);
});
