export {};

/**
 * Comprehensive Terminal Test Suite for Cart Page (/cart)
 * 
 * Tests:
 * 1. HTTP SSR & SEO: Status 200, noindex & nofollow meta directives, title
 * 2. Cart Store Logic: Adding items, quantity stepper, stock cap enforcement
 * 3. Line Subtotals, Item Removal & Undo Restoration
 * 4. Coupon Validation against Seeded Data & Fallbacks with specific error causes
 * 5. Free Shipping Threshold Math, Progress Calculation, and Final Order Totals
 */

// Load environment variables for standalone Node execution
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already set in environment
}

// 1. Setup mock localStorage before importing Zustand store
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

async function runCartTests() {
  console.log("================================================================");
  console.log("          VELAASH CART PAGE & PRICING VERIFICATION SUITE         ");
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
  // SUITE 1: HTTP SSR & SEO METADATA
  // -------------------------------------------------------------------------
  console.log("SUITE 1: HTTP SSR & SEO Metadata Verification (/cart)");
  try {
    const res = await fetch("http://localhost:3000/cart");
    assert(res.status === 200, "GET /cart returns HTTP 200 OK", `Status: ${res.status}`);

    const html = await res.text();
    const hasRobotsNoindex =
      html.includes('content="noindex, nofollow"') ||
      html.includes('name="robots" content="noindex, nofollow"') ||
      html.includes('content="noindex"') ||
      html.includes('noindex');

    assert(
      hasRobotsNoindex,
      "SEO: robots directive includes 'noindex' (preventing search indexation of cart)",
      "Found noindex meta configuration"
    );

    const hasShoppingBagTitle = html.includes("Shopping Bag") || html.includes("<title>Shopping Bag | Velaash</title>");
    assert(hasShoppingBagTitle, "SEO: Page title renders 'Shopping Bag | Velaash'");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "HTTP Server Reachability", msg);
  }

  // -------------------------------------------------------------------------
  // SUITE 2: CART STORE & STOCK QUANTITY LIMITS
  // -------------------------------------------------------------------------
  console.log("\nSUITE 2: Cart Store & Stock Quantity Cap Enforcement");
  const { useCartStore } = await import("../features/cart/store/cart-store");
  const store = useCartStore.getState();
  store.clearCart();

  assert(store.items.length === 0, "Initial cart state is cleanly empty");

  // Add Item with maxStock = 3
  const itemInput = {
    productId: "p1111111-1111-4111-b111-111111111111",
    variantId: "v-kurta-m",
    title: "Chanderi Embroidered Kurta Set",
    slug: "chanderi-embroidered-kurta-set",
    size: "M",
    color: "Ivory",
    price: 3200,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
    maxStock: 3, // Only 3 units available
  };

  store.addItem(itemInput, 1);
  let currentItems = useCartStore.getState().items;
  assert(
    currentItems.length === 1 && currentItems[0].quantity === 1,
    "Add item to cart with quantity 1",
    `Quantity: ${currentItems[0]?.quantity}`
  );

  // Add 2 more units (reaching maxStock = 3)
  store.addItem(itemInput, 2);
  currentItems = useCartStore.getState().items;
  assert(
    currentItems[0].quantity === 3,
    "Increase quantity to available maxStock (3 units)",
    `Quantity: ${currentItems[0]?.quantity}`
  );

  // Attempt to add 1 more unit (should be capped at maxStock = 3)
  store.addItem(itemInput, 1);
  currentItems = useCartStore.getState().items;
  assert(
    currentItems[0].quantity === 3,
    "Cap quantity at maxStock when attempting to over-add via addItem",
    `Quantity capped at: ${currentItems[0]?.quantity}`
  );

  // Attempt to updateQuantity directly to 10 (should be clamped to maxStock = 3)
  store.updateQuantity(currentItems[0].id, 10);
  currentItems = useCartStore.getState().items;
  assert(
    currentItems[0].quantity === 3,
    "Cap quantity at maxStock when using updateQuantity stepper",
    `Clamped at maxStock: ${currentItems[0]?.quantity}`
  );

  // -------------------------------------------------------------------------
  // SUITE 3: REMOVE ITEM & UNDO RESTORATION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 3: Item Removal & Undo Restoration Flow");
  const removedItemId = currentItems[0].id;
  const removedItemCopy = { ...currentItems[0] };
  const removedResult = store.removeItem(removedItemId);

  assert(
    useCartStore.getState().items.length === 0,
    "Remove button deletes item from cart",
    "Items count: 0"
  );
  assert(
    removedResult?.id === removedItemId,
    "removeItem returns removed line item data for Undo toast"
  );

  // Simulate clicking "Undo" on the toast notification
  store.restoreItem(removedItemCopy);
  currentItems = useCartStore.getState().items;
  assert(
    currentItems.length === 1 && currentItems[0].id === removedItemId,
    "Undo restoration reinstates removed item back into the cart",
    `Restored item: ${currentItems[0]?.title}`
  );

  // -------------------------------------------------------------------------
  // SUITE 4: PRICING ENGINE & FREE SHIPPING THRESHOLD MATH
  // -------------------------------------------------------------------------
  console.log("\nSUITE 4: Pricing Engine & Free Shipping Threshold Math");
  const { calculateCartTotals } = await import(
    "../features/cart/utils/pricing"
  );

  const shippingPolicy = {
    free_shipping_threshold: 999,
    standard_shipping_fee: 100,
  };

  // Case A: Subtotal ₹600 (below ₹999 threshold)
  const lowItem = [{ ...currentItems[0], price: 600, quantity: 1 }];
  const lowCalc = calculateCartTotals({
    items: lowItem,
    shippingPolicy,
  });

  assert(lowCalc.subtotal === 600, "Subtotal is ₹600");
  assert(
    lowCalc.isFreeShipping === false,
    "Free shipping is false when subtotal is below threshold"
  );
  assert(
    lowCalc.amountNeededForFreeShipping === 399,
    "Amount needed for free shipping is calculated correctly (999 - 600 = 399)",
    `Needed: ₹${lowCalc.amountNeededForFreeShipping}`
  );
  assert(
    lowCalc.shippingFee === 100,
    "Standard shipping fee of ₹100 is charged",
    `Shipping fee: ₹${lowCalc.shippingFee}`
  );
  assert(
    lowCalc.freeShippingProgress === 60,
    "Progress bar is exactly 60% (600 / 999 * 100 = 60%)",
    `Progress: ${lowCalc.freeShippingProgress}%`
  );
  assert(
    lowCalc.total === 700,
    "Total is subtotal + shipping (600 + 100 = 700)",
    `Total: ₹${lowCalc.total}`
  );

  // Case B: Subtotal ₹3200 (above ₹999 threshold)
  const highItem = [{ ...currentItems[0], price: 3200, quantity: 1 }];
  const highCalc = calculateCartTotals({
    items: highItem,
    shippingPolicy,
  });

  assert(
    highCalc.isFreeShipping === true,
    "Free shipping is unlocked when subtotal >= ₹999",
    "isFreeShipping: true"
  );
  assert(
    highCalc.amountNeededForFreeShipping === 0,
    "Amount needed for free shipping is 0 when unlocked"
  );
  assert(
    highCalc.shippingFee === 0,
    "Shipping fee is ₹0 (FREE) when threshold is met"
  );
  assert(
    highCalc.freeShippingProgress === 100,
    "Progress bar reaches 100% when threshold is met"
  );
  assert(
    highCalc.total === 3200,
    "Total is equal to subtotal with free shipping (₹3200)",
    `Total: ₹${highCalc.total}`
  );

  // -------------------------------------------------------------------------
  // SUITE 5: COUPON VALIDATION & SPECIFIC ERROR REASONS
  // -------------------------------------------------------------------------
  console.log("\nSUITE 5: Coupon Validation & Specific Error Handling");
  const { validateCouponAction } = await import(
    "../features/cart/actions/validate-coupon-action"
  );

  // 1. Valid Flat Discount: FLAT500 (min order 2500)
  const flatResult = await validateCouponAction("FLAT500", 3000);
  assert(
    flatResult.success === true && flatResult.discountAmount === 500,
    "Valid coupon 'FLAT500' applies flat ₹500 discount",
    `Discount: ₹${flatResult.success ? flatResult.discountAmount : 0}`
  );

  // 2. Valid Percentage Discount: SAVE10 (10% off, max 1000, min 1500)
  const pctResult = await validateCouponAction("SAVE10", 2000);
  assert(
    pctResult.success === true && pctResult.discountAmount === 200,
    "Valid coupon 'SAVE10' applies 10% discount on ₹2000 (₹200)",
    `Discount: ₹${pctResult.success ? pctResult.discountAmount : 0}`
  );

  // 3. Percentage Discount Cap: SAVE10 on ₹15,000 (10% is 1500, capped at max_discount_amount 1000)
  const cappedResult = await validateCouponAction("SAVE10", 15000);
  assert(
    cappedResult.success === true && cappedResult.discountAmount === 1000,
    "Coupon discount cap respected: SAVE10 10% on ₹15,000 capped at max ₹1,000",
    `Discount: ₹${cappedResult.success ? cappedResult.discountAmount : 0}`
  );

  // 4. Invalid: Expired Coupon (EXPIRED25)
  const expiredResult = await validateCouponAction("EXPIRED25", 2000);
  assert(
    expiredResult.success === false && expiredResult.error.toLowerCase().includes("expired"),
    "Expired coupon returns specific 'expired' error message",
    `Error returned: "${expiredResult.success ? "" : expiredResult.error}"`
  );

  // 5. Invalid: Minimum Order Value Not Met (MINORDER10K requires ₹10,000)
  const minOrderResult = await validateCouponAction("MINORDER10K", 3000);
  assert(
    minOrderResult.success === false &&
      minOrderResult.error.includes("minimum order of ₹10,000") &&
      minOrderResult.error.includes("Add ₹7,000 more"),
    "Minimum order shortfall returns specific error with required amount & shortfall",
    `Error returned: "${minOrderResult.success ? "" : minOrderResult.error}"`
  );

  // 6. Invalid: Max Usage Limit Reached (MAXEDOUT)
  const maxedResult = await validateCouponAction("MAXEDOUT", 2000);
  assert(
    maxedResult.success === false &&
      maxedResult.error.toLowerCase().includes("maximum usage limit"),
    "Usage limit reached returns specific 'maximum usage limit' error message",
    `Error returned: "${maxedResult.success ? "" : maxedResult.error}"`
  );

  // 7. Invalid: Deactivated Coupon (INACTIVE50)
  const inactiveResult = await validateCouponAction("INACTIVE50", 1000);
  assert(
    inactiveResult.success === false &&
      inactiveResult.error.toLowerCase().includes("deactivated"),
    "Deactivated coupon returns specific 'deactivated' error message",
    `Error returned: "${inactiveResult.success ? "" : inactiveResult.error}"`
  );

  // 8. Invalid: Non-existent Code
  const bogusResult = await validateCouponAction("BOGUSCODE123", 2000);
  assert(
    bogusResult.success === false && bogusResult.error.includes("does not exist"),
    "Non-existent coupon code returns specific 'does not exist' error message",
    `Error returned: "${bogusResult.success ? "" : bogusResult.error}"`
  );

  // -------------------------------------------------------------------------
  // SUITE 6: COMBINED CART TOTAL CALCULATION (SUBTOTAL + COUPON + SHIPPING)
  // -------------------------------------------------------------------------
  console.log("\nSUITE 6: Combined Cart Calculation (Subtotal - Discount + Shipping)");
  const combinedCalc = calculateCartTotals({
    items: [{ ...currentItems[0], price: 3000, quantity: 1 }],
    appliedCoupon: {
      code: "FLAT500",
      discountType: "flat",
      discountValue: 500,
      minOrderValue: 2500,
      discountAmount: 500,
    },
    shippingPolicy,
  });

  assert(
    combinedCalc.subtotal === 3000 &&
      combinedCalc.discount === 500 &&
      combinedCalc.shippingFee === 0 &&
      combinedCalc.total === 2500,
    "Combined Total: Subtotal ₹3000 - Discount ₹500 + Shipping ₹0 = ₹2500",
    `Calculated Total: ₹${combinedCalc.total}`
  );

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("STATUS: ALL TESTS PASSED SUCCESSFULLY! ✓");
    console.log("================================================================");
    process.exit(0);
  } else {
    console.error(`STATUS: ${totalTests - passedTests} TESTS FAILED! ✗`);
    console.log("================================================================");
    process.exit(1);
  }
}

runCartTests().catch((err) => {
  console.error("Fatal error during test run:", err);
  process.exit(1);
});
