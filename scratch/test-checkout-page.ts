export {};

/**
 * Comprehensive Terminal Test Suite for Checkout Page (/checkout) & Order Creation
 * 
 * Tests:
 * 1. HTTP SSR & SEO Metadata: Status 200, noindex directives on /checkout & /order-confirmation/[orderNumber]
 * 2. Empty Cart Guard: Fails gracefully when checkout attempted with empty cart
 * 3. Out-of-Stock Guard: Blocks checkout and fails gracefully when variant is out of stock or requested qty exceeds available stock
 * 4. End-to-End COD Checkout: Computes subtotal, coupon discount, shipping, COD handling fee, authoritative total, and generates order_number
 * 5. Idempotency Check: Confirms that duplicate submission does NOT create duplicate orders or double-deduct inventory
 */

// Load environment variables for standalone Node execution
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already set in environment
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

async function runCheckoutTests() {
  console.log("================================================================");
  console.log("       VELAASH CHECKOUT PAGE & ORDER CREATION VERIFICATION       ");
  console.log("================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${testName}`);
      if (detail) console.log(`         ${detail}`);
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (detail) console.error(`         Reason: ${detail}`);
    }
  }

  // -------------------------------------------------------------------------
  // SUITE 1: HTTP SSR & SEO METADATA (/checkout & /order-confirmation)
  // -------------------------------------------------------------------------
  console.log("SUITE 1: HTTP SSR & SEO Metadata Verification");
  try {
    // 1. Checkout page
    const checkoutRes = await fetch("http://localhost:3000/checkout");
    assert(checkoutRes.status === 200, "GET /checkout returns HTTP 200 OK", `Status: ${checkoutRes.status}`);

    const checkoutHtml = await checkoutRes.text();
    const checkoutHasNoindex =
      checkoutHtml.includes('content="noindex, nofollow"') ||
      checkoutHtml.includes('name="robots" content="noindex, nofollow"') ||
      checkoutHtml.includes('content="noindex"') ||
      checkoutHtml.includes('noindex');

    assert(
      checkoutHasNoindex,
      "SEO: /checkout has 'noindex' robots directive (protecting checkout page)",
      "Found noindex meta configuration"
    );

    const checkoutTitle = checkoutHtml.includes("Checkout") || checkoutHtml.includes("Velaash");
    assert(checkoutTitle, "SEO: /checkout renders page title with brand context");

    // 2. Order confirmation page
    const orderConfRes = await fetch("http://localhost:3000/order-confirmation/VEL-2026-00001");
    assert(orderConfRes.status === 200, "GET /order-confirmation/[orderNumber] returns HTTP 200 OK", `Status: ${orderConfRes.status}`);

    const confHtml = await orderConfRes.text();
    const confHasNoindex =
      confHtml.includes('content="noindex, nofollow"') ||
      confHtml.includes('content="noindex"') ||
      confHtml.includes('noindex');

    assert(
      confHasNoindex,
      "SEO: /order-confirmation has 'noindex' robots directive (protecting customer receipt)",
      "Found noindex meta configuration"
    );

    const hasOrderNumber = confHtml.includes("VEL-2026-00001");
    assert(hasOrderNumber, "Order Confirmation page renders order reference number correctly");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "HTTP Server Reachability", msg);
  }

  // Import createOrderAction and mock catalog
  const { createOrderAction } = await import(
    "../features/checkout/actions/create-order-action"
  );

  // -------------------------------------------------------------------------
  // SUITE 2: ACCESS RULES & EMPTY CART VALIDATION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 2: Empty Cart & Access Rules Validation");

  const emptyCartResult = await createOrderAction({
    contact: {
      email: "buyer@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "123 Indiranagar, 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    },
    paymentMethod: "cod",
    items: [], // EMPTY CART!
    idempotencyKey: "test-empty-cart-1",
  });

  assert(
    emptyCartResult.success === false && emptyCartResult.code === "EMPTY_CART",
    "createOrderAction rejects empty cart gracefully",
    `Error returned: "${emptyCartResult.success ? "" : emptyCartResult.error}"`
  );

  // -------------------------------------------------------------------------
  // SUITE 3: SERVER-SIDE OUT-OF-STOCK ENFORCEMENT
  // -------------------------------------------------------------------------
  // SUITE 3: SERVER-SIDE OUT-OF-STOCK ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log("\nSUITE 3: Server-Side Out-of-Stock & Inventory Cap Enforcement");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const adminClient = createAdminClient();
  const { data: dbVariant } = await adminClient
    .from("product_variants")
    .select("id, product_id, stock_quantity, products!inner(id, name, base_price, is_active)")
    .eq("products.is_active", true)
    .eq("is_active", true)
    .gte("stock_quantity", 2)
    .limit(1)
    .single();

  if (!dbVariant) {
    throw new Error("No active product variant with stock found in database for checkout test");
  }

  const testProductId = dbVariant.product_id;
  const testVariantId = dbVariant.id;
  const initialStock = dbVariant.stock_quantity;
  const unitPrice = Number((dbVariant as unknown as { products: { base_price: number } }).products.base_price);

  const outOfStockResult = await createOrderAction({
    contact: {
      email: "buyer@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "123 Indiranagar, 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    },
    paymentMethod: "cod",
    items: [
      {
        productId: testProductId,
        variantId: testVariantId,
        quantity: Math.min(50, initialStock + 10), // Exceeds available stock but within schema max cap (50 units)
      },
    ],
    idempotencyKey: "test-out-of-stock-1",
  });

  assert(
    outOfStockResult.success === false && outOfStockResult.code === "OUT_OF_STOCK",
    "createOrderAction blocks order creation when requested qty exceeds stock",
    `Error returned: "${outOfStockResult.success ? "" : outOfStockResult.error}"`
  );

  // -------------------------------------------------------------------------
  // SUITE 3B: SECURITY AUDIT & DIRECT INPUT TAMPERING REJECTION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 3B: Security Audit & Direct Input Tampering Rejection");

  // 1. Negative quantity injection attempt
  const negativeQtyResult = await createOrderAction({
    contact: { email: "attacker@example.com", phone: "9876543210" },
    shippingAddress: {
      fullName: "Test Attacker",
      phone: "9876543210",
      addressLine1: "123 Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
    paymentMethod: "cod",
    items: [{ productId: "p1", variantId: "v1", quantity: -5 }],
    idempotencyKey: "exploit-negative-qty-1",
  });
  assert(
    negativeQtyResult.success === false && negativeQtyResult.code === "INVALID_INPUT",
    "createOrderAction rejects negative quantity tampering attempts",
    `Error: ${negativeQtyResult.success ? "NONE" : negativeQtyResult.error}`
  );

  // 2. Invalid Indian PIN code injection attempt
  const invalidPincodeResult = await createOrderAction({
    contact: { email: "attacker@example.com", phone: "9876543210" },
    shippingAddress: {
      fullName: "Test Attacker",
      phone: "9876543210",
      addressLine1: "123 Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "012345", // Invalid: Indian PIN cannot start with 0
    },
    paymentMethod: "cod",
    items: [{ productId: testProductId, variantId: testVariantId, quantity: 1 }],
    idempotencyKey: "exploit-bad-pin-1",
  });
  assert(
    invalidPincodeResult.success === false && invalidPincodeResult.code === "INVALID_INPUT",
    "createOrderAction enforces strict 6-digit Indian PIN regex validation",
    `Error: ${invalidPincodeResult.success ? "NONE" : invalidPincodeResult.error}`
  );

  // 3. Client environment import protection (lib/supabase/admin.ts runtime check)
  let browserViolationCaught = false;
  try {
    // Simulate browser global window
    (globalThis as unknown as { window: unknown }).window = {};
    // Dynamic import to test guard
    createAdminClient();
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("SECURITY VIOLATION")) {
      browserViolationCaught = true;
    }
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
  assert(
    browserViolationCaught,
    "lib/supabase/admin.ts throws fatal security violation if loaded in browser/client context"
  );

  // -------------------------------------------------------------------------
  // SUITE 4: END-TO-END COD CHECKOUT & AUTHORITATIVE PRICING
  // -------------------------------------------------------------------------
  console.log("\nSUITE 4: End-to-End COD Order Creation & Authoritative Pricing");
  console.log(`         Initial variant stock before purchase: ${initialStock}`);

  const idempotencyKey = `idemp-test-order-${Date.now()}`;

  const codOrderResult = await createOrderAction({
    contact: {
      email: "priya.sharma@example.com",
      phone: "9876543210",
      createAccount: true,
    },
    shippingAddress: {
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "Flat 402, Lotus Towers, 5th Main",
      addressLine2: "Near Metro Station",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      addressType: "home",
      saveAddress: true,
    },
    paymentMethod: "cod",
    items: [
      {
        productId: testProductId,
        variantId: testVariantId,
        quantity: 1,
      },
    ],
    couponCode: "SAVE10", // 10% coupon off unitPrice
    idempotencyKey,
  });

  assert(
    codOrderResult.success === true,
    "createOrderAction successfully creates COD order",
    `Order reference: ${codOrderResult.success ? codOrderResult.orderNumber : "FAILED: " + (codOrderResult.error || "")}`
  );

  if (codOrderResult.success) {
    assert(
      codOrderResult.orderNumber.startsWith("VEL-"),
      "Order number follows authoritative format 'VEL-YYYY-00001'",
      `Generated: ${codOrderResult.orderNumber}`
    );

    // Verified Math:
    // Subtotal: unitPrice
    // Discount: 10% of unitPrice (capped at 1000)
    // Shipping: 0 if unitPrice >= 999 else 99
    // COD Handling Fee: 99
    const expectedDiscount = Math.min(Math.round(unitPrice * 0.1), 1000);
    const expectedShipping = unitPrice >= 999 ? 0 : 99;
    const expectedTotal = unitPrice - expectedDiscount + expectedShipping + 99;
    assert(
      codOrderResult.totalAmount === expectedTotal,
      `Authoritative total recalculation is exact: ₹${expectedTotal} (Subtotal ₹${unitPrice} - Discount ₹${expectedDiscount} + Shipping ₹${expectedShipping} + COD Fee ₹99)`,
      `Order total: ₹${codOrderResult.totalAmount}`
    );
  }

  // Stock check in DB: stock should have decreased by 1
  const { data: variantAfterOrder } = await adminClient
    .from("product_variants")
    .select("stock_quantity")
    .eq("id", testVariantId)
    .single();
  const stockAfterOrder = variantAfterOrder?.stock_quantity ?? 0;
  console.log(`         Stock after first purchase: ${stockAfterOrder}`);
  assert(
    stockAfterOrder === initialStock - 1,
    "Stock was decremented by purchased quantity (1 unit)"
  );

  // -------------------------------------------------------------------------
  // SUITE 5: IDEMPOTENCY CHECK & DOUBLE STOCK DEDUCTION PROTECTION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 5: Idempotency & Double Stock Deduction Protection");

  // Re-submit the EXACT same checkout request with the same idempotency key
  const duplicateOrderResult = await createOrderAction({
    contact: {
      email: "priya.sharma@example.com",
      phone: "9876543210",
      createAccount: true,
    },
    shippingAddress: {
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "Flat 402, Lotus Towers, 5th Main",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
    paymentMethod: "cod",
    items: [
      {
        productId: testProductId,
        variantId: testVariantId,
        quantity: 1,
      },
    ],
    couponCode: "SAVE10",
    idempotencyKey, // SAME IDEMPOTENCY KEY!
  });

  assert(
    duplicateOrderResult.success === true && duplicateOrderResult.isDuplicate === true,
    "Idempotency filter detects duplicate submission and returns existing order",
    `isDuplicate: ${duplicateOrderResult.success ? duplicateOrderResult.isDuplicate : false}`
  );

  if (codOrderResult.success && duplicateOrderResult.success) {
    assert(
      duplicateOrderResult.orderNumber === codOrderResult.orderNumber,
      "Duplicate submission returns identical orderNumber reference",
      `Order number: ${duplicateOrderResult.orderNumber}`
    );
  }

  // Critical stock check: stock must NOT have decreased a second time!
  const { data: variantAfterDup } = await adminClient
    .from("product_variants")
    .select("stock_quantity")
    .eq("id", testVariantId)
    .single();
  const stockAfterDuplicate = variantAfterDup?.stock_quantity ?? 0;
  console.log(`         Stock after duplicate submission: ${stockAfterDuplicate}`);
  assert(
    stockAfterDuplicate === stockAfterOrder,
    "Stock was NOT double-deducted on duplicate submission (Idempotency Verified ✓)"
  );

  // Cleanup: Restore stock quantity for test variant
  await adminClient
    .from("product_variants")
    .update({ stock_quantity: initialStock })
    .eq("id", testVariantId);

  // -------------------------------------------------------------------------
  // FINAL RESULT SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("STATUS: ALL CHECKOUT & ORDER CREATION TESTS PASSED! ✓");
    console.log("================================================================");
    process.exit(0);
  } else {
    console.error(`STATUS: ${totalTests - passedTests} TESTS FAILED! ✗`);
    console.log("================================================================");
    process.exit(1);
  }
}

runCheckoutTests().catch((err) => {
  console.error("Fatal error during test run:", err);
  process.exit(1);
});
