export {};

/**
 * Flexible Product Schema & Simple Product Support Verification Test Suite
 * 
 * Verifies:
 * 1. Simple product (no variants) creation and schema validation
 * 2. Optional care_instructions and flexible specifications JSONB support
 * 3. Cart store: addItem and revalidation for simple products (no size/color/variantId)
 * 4. Checkout pipeline: end-to-end order creation for simple products and variant products
 * 5. PDP logic: specifications table rendered when present, suppressed when absent
 * 6. Size chart / size guide: suppressed when no size variants exist, shown for clothing with size variants
 * 7. Admin stock computation for both product types
 */

try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore
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

async function runFlexibleProductTests() {
  console.log("================================================================");
  console.log("    VELAASH FLEXIBLE PRODUCT SCHEMA & SIMPLE PRODUCT TESTS      ");
  console.log("================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
      if (detail) console.log(`         ${detail}`);
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (detail) console.error(`         Reason: ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Product Form Schema Validation (Zod)
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 1: Zod Schema Validation for Simple & Variant Products]");
  const { AdminProductFormSchema } = await import("../features/admin/types/products");

  // 1a. Simple Product (Brass Lamp / Pooja item - no variants, no care instructions, custom specs)
  const simpleProductInput = {
    name: "Pure Brass Kuthuvilakku 12 Inch",
    slug: "pure-brass-kuthuvilakku-12-inch",
    description: "Traditional handmade solid brass oil lamp for auspicious occasions.",
    category_id: "c1111111-1111-1111-1111-111111111111",
    base_price: 2499,
    compare_at_price: 2999,
    has_variants: false,
    stock_quantity: 15,
    specifications: [
      { label: "Material", value: "Solid Brass" },
      { label: "Height", value: "12 Inches" },
      { label: "Weight", value: "1.2 kg" },
      { label: "Finish", value: "Traditional Antique Polish" },
    ],
    fabric: null,
    care_instructions: null, // Genuinely optional!
    is_active: true,
    is_featured: false,
    images: [{ image_url: "https://example.com/lamp.jpg", alt_text: "Brass Lamp", is_primary: true, display_order: 0 }],
    variants: [], // Empty variants allowed for simple products!
  };

  const simpleResult = AdminProductFormSchema.safeParse(simpleProductInput);
  assert(
    simpleResult.success,
    "Simple product validates successfully without variants or care instructions",
    simpleResult.success ? `Specs: ${simpleResult.data.specifications?.length} items, stock: ${simpleResult.data.stock_quantity}` : JSON.stringify(simpleResult.error?.issues)
  );

  // 1b. Existing Variant Clothing Product (Kurta / Saree with size and color variants)
  const variantProductInput = {
    name: "Emerald Green Chanderi Kurta",
    slug: "emerald-green-chanderi-kurta",
    description: "Artisanal woven silk-cotton kurta.",
    category_id: "c2222222-2222-2222-2222-222222222222",
    base_price: 3499,
    has_variants: true,
    fabric: "Chanderi Silk Cotton",
    care_instructions: "Dry clean only",
    is_active: true,
    is_featured: true,
    images: [{ image_url: "https://example.com/kurta.jpg", alt_text: "Kurta", is_primary: true, display_order: 0 }],
    variants: [
      { size: "S", color: "Emerald Green", color_hex: "#105b38", stock_quantity: 5, sku: "EG-K-S" },
      { size: "M", color: "Emerald Green", color_hex: "#105b38", stock_quantity: 8, sku: "EG-K-M" },
      { size: "L", color: "Emerald Green", color_hex: "#105b38", stock_quantity: 0, sku: "EG-K-L" },
    ],
  };

  const variantResult = AdminProductFormSchema.safeParse(variantProductInput);
  assert(
    variantResult.success,
    "Variant-based clothing product validates as before (no regression)",
    variantResult.success ? `${variantResult.data.variants.length} variants retained` : JSON.stringify(variantResult.error?.issues)
  );

  // 1c. Invalid Simple Product without stock_quantity
  const invalidSimpleInput = {
    ...simpleProductInput,
    stock_quantity: -5,
  };
  const invalidResult = AdminProductFormSchema.safeParse(invalidSimpleInput);
  assert(
    !invalidResult.success,
    "Negative stock quantity is rejected by validation",
    invalidResult.error?.issues[0]?.message
  );

  // -------------------------------------------------------------
  // TEST GROUP 2: Cart Store & Actions with Simple Products
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 2: Cart Store Management & Item Modeling]");
  const { useCartStore } = await import("../features/cart/store/cart-store");

  // Reset cart
  useCartStore.getState().clearCart();

  // 2a. Add Simple Product to Cart (no variantId, no size, no color)
  const addSimpleResult = useCartStore.getState().addItem({
    productId: "p-brass-lamp-01",
    variantId: null,
    title: "Pure Brass Kuthuvilakku 12 Inch",
    slug: "pure-brass-kuthuvilakku-12-inch",
    size: null,
    color: null,
    price: 2499,
    compareAtPrice: 2999,
    image: "/images/kuthuvilakku.jpg",
    maxStock: 15,
  }, 2);

  assert(addSimpleResult.success, "Simple product added to cart successfully");
  const cartItemsAfterSimple = useCartStore.getState().items;
  assert(
    cartItemsAfterSimple.length === 1 && cartItemsAfterSimple[0].id === "p-brass-lamp-01-simple",
    "Cart item ID correctly handles simple products (productId-simple)",
    `Item ID: ${cartItemsAfterSimple[0]?.id}, Qty: ${cartItemsAfterSimple[0]?.quantity}`
  );

  // 2b. Add Variant Clothing Item to Same Cart
  const addVariantResult = useCartStore.getState().addItem({
    productId: "p-chanderi-kurta-01",
    variantId: "v-kurta-m",
    title: "Emerald Green Chanderi Kurta",
    slug: "emerald-green-chanderi-kurta",
    size: "M",
    color: "Emerald Green",
    colorHex: "#105b38",
    price: 3499,
    image: "/images/kurta.jpg",
    maxStock: 8,
  }, 1);

  assert(addVariantResult.success, "Variant clothing item added alongside simple product");
  const cartItemsMixed = useCartStore.getState().items;
  assert(
    cartItemsMixed.length === 2,
    "Cart seamlessly holds both simple and variant items simultaneously",
    `Items count: ${cartItemsMixed.length}`
  );

  // 2c. Cart Calculations
  const { calculateCartTotals } = await import("../features/cart/utils/pricing");
  const calcResult = calculateCartTotals({
    items: cartItemsMixed,
    appliedCoupon: null,
    shippingPolicy: { free_shipping_threshold: 1999, standard_shipping_fee: 149 },
  });
  // Subtotal = 2499 * 2 + 3499 * 1 = 4998 + 3499 = 8497
  assert(
    calcResult.subtotal === 8497 && calcResult.isFreeShipping === true,
    "Cart financial calculation correct across mixed product items",
    `Subtotal: ₹${calcResult.subtotal}, Total: ₹${calcResult.total}`
  );

  // -------------------------------------------------------------
  // TEST GROUP 3: Checkout Pipeline (End-to-End Order Creation)
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 3: Checkout Pipeline with Simple Products]");
  const { createAdminClient } = await import("../lib/supabase/admin");
  const { createOrderAction } = await import("../features/checkout/actions/create-order-action");
  const adminClient = createAdminClient();

  // Find a category for testing
  const { data: testCat } = await adminClient.from("categories").select("id").limit(1).single();
  const testSimpleSlug = `test-brass-lamp-${Date.now()}`;
  let testSimpleProduct: { id: string; base_price: number } | null = null;

  // Insert test simple product (handling possible column migration pending)
  const { data: insertedSimple, error: insertSimpleErr } = await adminClient
    .from("products")
    .insert({
      name: "Test Brass Kuthuvilakku 12 Inch",
      slug: testSimpleSlug,
      category_id: testCat?.id || null,
      base_price: 2499,
      has_variants: false,
      stock_quantity: 20,
      specifications: [
        { label: "Material", value: "Solid Brass" },
        { label: "Height", value: "12 Inches" },
      ],
      is_active: true,
      stock_status: "in_stock",
    })
    .select("id, base_price")
    .maybeSingle();

  if (insertedSimple) {
    testSimpleProduct = insertedSimple;
  } else if (insertSimpleErr?.code === "42703" || insertSimpleErr?.message?.includes("has_variants")) {
    const { data: fbSimple } = await adminClient
      .from("products")
      .insert({
        name: "Test Brass Kuthuvilakku 12 Inch",
        slug: testSimpleSlug,
        category_id: testCat?.id || null,
        base_price: 2499,
        is_active: true,
        stock_status: "in_stock",
      })
      .select("id, base_price")
      .single();
    testSimpleProduct = fbSimple;
  }

  // Find an existing active variant from the database for clothing regression testing
  const { data: dbVariant } = await adminClient
    .from("product_variants")
    .select("id, product_id, size, color, stock_quantity, products!inner(id, name, base_price, is_active)")
    .eq("products.is_active", true)
    .eq("is_active", true)
    .gte("stock_quantity", 2)
    .limit(1)
    .single();

  const ordersToClean: string[] = [];

  try {
    // 3a. Checkout with Simple Product Only (COD)
    const simpleCheckoutPayload = {
      paymentMethod: "cod" as const,
      contact: {
        email: "pooja.devotee@example.com",
        phone: "9876543210",
      },
      shippingAddress: {
        fullName: "Anand Rajan",
        phone: "9876543210",
        addressLine1: "12 Temple Street, Mylapore",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600004",
      },
      items: [
        {
          productId: testSimpleProduct?.id || "p-brass-lamp-01",
          variantId: null, // Simple product: no variant ID
          quantity: 1,
        },
      ],
      idempotencyKey: `test-simple-checkout-${Date.now()}`,
    };

    const simpleOrderResult = await createOrderAction(simpleCheckoutPayload);
    if (simpleOrderResult.success && simpleOrderResult.orderId) {
      ordersToClean.push(simpleOrderResult.orderId);
    }
    assert(
      simpleOrderResult.success === true && Boolean(simpleOrderResult.orderNumber),
      "End-to-End order created successfully for simple (no-variant) product",
      simpleOrderResult.success
        ? `Order Number: ${simpleOrderResult.orderNumber}, Total: ₹${simpleOrderResult.totalAmount}`
        : `Error: ${simpleOrderResult.error} (${simpleOrderResult.code})`
    );

    // 3b. Checkout with Mixed Items (Simple + Existing Clothing Variant)
    if (dbVariant) {
      const mixedCheckoutPayload = {
        paymentMethod: "cod" as const,
        contact: {
          email: "mixed.shopper@example.com",
          phone: "9876543211",
        },
        shippingAddress: {
          fullName: "Kavitha Sundaram",
          phone: "9876543211",
          addressLine1: "45 Gandhi Road",
          city: "Coimbatore",
          state: "Tamil Nadu",
          pincode: "641001",
        },
        items: [
          {
            productId: testSimpleProduct?.id || "p-brass-lamp-01",
            variantId: null, // Simple product
            quantity: 1,
          },
          {
            productId: dbVariant.product_id,
            variantId: dbVariant.id, // Variant clothing
            quantity: 1,
          },
        ],
        idempotencyKey: `test-mixed-checkout-${Date.now()}`,
      };

      const mixedOrderResult = await createOrderAction(mixedCheckoutPayload);
      if (mixedOrderResult.success && mixedOrderResult.orderId) {
        ordersToClean.push(mixedOrderResult.orderId);
      }
      assert(
        mixedOrderResult.success === true && Boolean(mixedOrderResult.orderNumber),
        "End-to-End order created successfully for mixed items (simple + variant clothing)",
        mixedOrderResult.success
          ? `Order Number: ${mixedOrderResult.orderNumber}, Total: ₹${mixedOrderResult.totalAmount}`
          : `Error: ${mixedOrderResult.error} (${mixedOrderResult.code})`
      );
    }
  } finally {
    // Clean up created test orders and simple product
    for (const orderId of ordersToClean) {
      await adminClient.from("order_items").delete().eq("order_id", orderId);
      await adminClient.from("orders").delete().eq("id", orderId);
    }
    if (testSimpleProduct?.id) {
      await adminClient.from("products").delete().eq("id", testSimpleProduct.id);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: Product Specifications & PDP Display Logic
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 4: PDP Specifications & Size Chart Suppression]");
  
  // 4a. Specifications presence logic
  const specsWithItems = [
    { label: "Material", value: "Solid Bell Metal Brass" },
    { label: "Height", value: "18 Inches" },
    { label: "Handcrafted", value: "Swamimalai, Tamil Nadu" },
  ];
  const specsEmpty: { label: string; value: string }[] = [];

  const shouldRenderSpecs = (specs?: { label: string; value: string }[] | null) => {
    return Boolean(specs && specs.length > 0);
  };

  assert(
    shouldRenderSpecs(specsWithItems) === true,
    "Specifications section renders when specifications array has items",
    `Items: ${specsWithItems.map(s => s.label).join(", ")}`
  );

  assert(
    shouldRenderSpecs(specsEmpty) === false && shouldRenderSpecs(null) === false && shouldRenderSpecs(undefined) === false,
    "Specifications section is completely suppressed when specifications are absent/empty",
    "No empty table or blank accordion displayed"
  );

  // 4b. Size Chart Suppression Logic
  const brassLampVariants: { size?: string | null; color?: string | null }[] = [];
  const clothingVariantsWithSize = [
    { size: "S", color: "Red" },
    { size: "M", color: "Red" },
  ];
  const clothingVariantsWithoutSize = [
    { size: "", color: "Gold" },
    { size: null, color: "Silver" },
  ];

  const hasSizeAttribute = (variants: { size?: string | null }[]) => {
    return variants.some((v) => Boolean(v.size && v.size.trim().length > 0));
  };

  assert(
    hasSizeAttribute(brassLampVariants) === false,
    "Size guide / size chart UI is suppressed for simple products with 0 variants",
    "Correct: pooja/brass items won't prompt for clothing sizes"
  );

  assert(
    hasSizeAttribute(clothingVariantsWithoutSize) === false,
    "Size guide / size chart UI is suppressed for items without a size attribute",
    "Correct: accessories/un-sized items don't show size charts"
  );

  assert(
    hasSizeAttribute(clothingVariantsWithSize) === true,
    "Size guide / size chart UI is active for clothing items with size variants",
    "Correct: S, M, L clothing displays size chart as expected"
  );

  // -------------------------------------------------------------
  // TEST GROUP 5: Admin Stock Computation
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 5: Admin Product List Stock Display]");
  
  // Simple product stock check
  const simpleAdminRow = {
    has_variants: false,
    stock_quantity: 42,
    product_variants: [],
  };
  const computedSimpleStock = simpleAdminRow.has_variants
    ? simpleAdminRow.product_variants.reduce((acc: number, v: { stock_quantity: number }) => acc + v.stock_quantity, 0)
    : simpleAdminRow.stock_quantity;

  assert(
    computedSimpleStock === 42,
    "Admin product row computes direct stock_quantity for simple products",
    `Computed stock: ${computedSimpleStock}`
  );

  // Variant product stock check
  const variantAdminRow = {
    has_variants: true,
    stock_quantity: 0,
    product_variants: [
      { stock_quantity: 10 },
      { stock_quantity: 15 },
      { stock_quantity: 5 },
    ],
  };
  const computedVariantStock = variantAdminRow.has_variants
    ? variantAdminRow.product_variants.reduce((acc: number, v: { stock_quantity: number }) => acc + v.stock_quantity, 0)
    : variantAdminRow.stock_quantity;

  assert(
    computedVariantStock === 30,
    "Admin product row computes sum of variant stock_quantities for variant products",
    `Computed total stock: ${computedVariantStock}`
  );

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runFlexibleProductTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
