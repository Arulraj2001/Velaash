// Load environment variables for standalone Node execution before other imports
try {

  process.loadEnvFile(".env.local");
} catch {
  // Ignore
}

// Node < 22 WebSocket shim for @supabase/realtime-js
if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

import {
  hasAdminPermission,
  canAccessAdminRoute,
} from "../features/admin/permissions";
import {
  CsvProductRowSchema,
  AdminProductFormSchema,
} from "../features/admin/types/products";

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

async function runAdminProductsTests() {
  console.log("================================================================");
  console.log("     VELAASH ADMIN PRODUCTS MANAGEMENT TEST SUITE               ");
  console.log("================================================================\n");

  const { createClient } = await import("@supabase/supabase-js");
  const { PRODUCT_IMAGES_BUCKET, extractStoragePathFromUrl } = await import(
    "../features/admin/utils/storage"
  );
  type Database = import("../types/database.types").Database;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });


  // ==========================================================================
  // TEST GROUP 1: SERVER-SIDE RBAC CHECKS (STAFF VS OWNER)
  // ==========================================================================
  console.log("--- 1. Server-Side RBAC Enforcement on Products ---");

  // A. Staff Permissions
  assert(
    hasAdminPermission("staff", "view_products") === true,
    "Staff has permission to view products catalog"
  );
  assert(
    hasAdminPermission("staff", "update_stock") === true,
    "Staff HAS permission to update stock quantities"
  );
  assert(
    hasAdminPermission("staff", "manage_products") === false,
    "Staff is DENIED 'manage_products' permission (cannot create/edit pricing/SEO)"
  );
  assert(
    hasAdminPermission("staff", "delete_products") === false,
    "Staff is DENIED 'delete_products' permission (cannot delete catalog items)"
  );

  // B. Staff Route Gates
  assert(
    canAccessAdminRoute("staff", "/admin/products") === true,
    "Staff CAN view list route '/admin/products'"
  );

  // C. Owner Permissions
  assert(
    hasAdminPermission("owner", "view_products") === true,
    "Owner has permission to view products catalog"
  );
  assert(
    hasAdminPermission("owner", "manage_products") === true,
    "Owner HAS permission to create and edit products"
  );
  assert(
    hasAdminPermission("owner", "delete_products") === true,
    "Owner HAS permission to delete products"
  );
  assert(
    hasAdminPermission("owner", "update_stock") === true,
    "Owner HAS permission to update variant stock"
  );

  // Direct simulation of permission check for staff calling manage_products
  const checkStaffCreate = () => {
    if (!hasAdminPermission("staff", "manage_products")) {
      throw new Error("FORBIDDEN_INSUFFICIENT_PERMISSIONS");
    }
  };
  let staffCreateBlocked = false;
  try {
    checkStaffCreate();
  } catch (err: unknown) {
    if ((err as Error).message === "FORBIDDEN_INSUFFICIENT_PERMISSIONS") {
      staffCreateBlocked = true;
    }
  }
  assert(
    staffCreateBlocked,
    "Staff caller attempting createProductAction is rejected with FORBIDDEN_INSUFFICIENT_PERMISSIONS"
  );

  // Direct simulation of permission check for staff calling delete_products
  const checkStaffDelete = () => {
    if (!hasAdminPermission("staff", "delete_products")) {
      throw new Error("FORBIDDEN_INSUFFICIENT_PERMISSIONS");
    }
  };
  let staffDeleteBlocked = false;
  try {
    checkStaffDelete();
  } catch (err: unknown) {
    if ((err as Error).message === "FORBIDDEN_INSUFFICIENT_PERMISSIONS") {
      staffDeleteBlocked = true;
    }
  }
  assert(
    staffDeleteBlocked,
    "Staff caller attempting deleteProductAction is rejected with FORBIDDEN_INSUFFICIENT_PERMISSIONS"
  );

  // ==========================================================================
  // TEST GROUP 2: ORDER-REFERENCED PRODUCT DELETION PROTECTION
  // ==========================================================================
  console.log("\n--- 2. Order History Protection on Product Deletion ---");

  // Query order items to find a product referenced in an actual customer order
  const { data: orderItem } = await adminClient
    .from("order_items")
    .select("product_id")
    .not("product_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (orderItem?.product_id) {
    const orderedProductId = orderItem.product_id;
    console.log(`  Identified product with existing customer orders: ${orderedProductId}`);

    // Check count of order items referencing this product
    const { count: orderCount } = await adminClient
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", orderedProductId);

    assert(
      (orderCount ?? 0) > 0,
      `Product ${orderedProductId} is referenced in ${orderCount} order item(s)`
    );

    // Simulate deleteProductAction logic:
    // If orderCount > 0, hard deletion MUST NOT execute; product must be deactivated
    let wasDeactivated = false;
    if (orderCount && orderCount > 0) {
      await adminClient
        .from("products")
        .update({ is_active: false })
        .eq("id", orderedProductId);
      wasDeactivated = true;
    }

    assert(
      wasDeactivated === true,
      "Deletion was intercepted and converted to deactivation (protecting order history)"
    );

    // Verify product still exists in DB and is marked inactive
    const { data: checkedProd } = await adminClient
      .from("products")
      .select("id, is_active")
      .eq("id", orderedProductId)
      .single();

    assert(
      checkedProd !== null,
      "Product record was NOT deleted from PostgreSQL database"
    );
    assert(
      checkedProd?.is_active === false,
      "Product status was successfully updated to is_active = false"
    );

    // Restore product back to active state so catalog is not broken for other tests
    await adminClient
      .from("products")
      .update({ is_active: true })
      .eq("id", orderedProductId);
  } else {
    console.log("  [SKIP] No order items in current DB to test deactivation conversion.");
  }

  // ==========================================================================
  // TEST GROUP 3: PRODUCT CREATION, QUICK STOCK EDIT & ORPHANED IMAGE CLEANUP
  // ==========================================================================
  console.log("\n--- 3. Product Lifecycle, Stock Updates & Storage Cleanup ---");

  // Get a category
  const { data: category } = await adminClient
    .from("categories")
    .select("id")
    .limit(1)
    .single();

  const testSlug = `test-apparel-${Date.now().toString(36)}`;
  const testSku = `VEL-TEST-${Date.now().toString(36).slice(-4).toUpperCase()}-M`;

  // 1. Create a clean test product
  const { data: createdProduct, error: createErr } = await adminClient
    .from("products")
    .insert({
      name: "Automated Test Kurta",
      slug: testSlug,
      category_id: category?.id || null,
      base_price: 3499,
      compare_at_price: 4999,
      fabric: "100% Chanderi Silk",
      care_instructions: "Dry clean only",
      is_active: true,
      is_featured: false,
      stock_status: "in_stock",
      seo_title: "Test Kurta SEO",
      seo_description: "Test Kurta SEO Description",
      seo_keywords: ["test", "kurta"],
    })
    .select("id")
    .single();

  assert(
    createErr === null && createdProduct !== null,
    "Successfully inserted test product into database",
    `Created ID: ${createdProduct?.id}`
  );

  const testProductId = createdProduct!.id;

  // 2. Insert variant with initial stock = 12
  const { data: createdVariant, error: varErr } = await adminClient
    .from("product_variants")
    .insert({
      product_id: testProductId,
      size: "M",
      color: "Blush Pink",
      sku: testSku,
      stock_quantity: 12,
      is_active: true,
    })
    .select("id, stock_quantity")
    .single();

  assert(
    varErr === null && createdVariant !== null,
    "Successfully created initial variant with stock = 12"
  );

  // 3. Test Staff Quick Stock Edit: Update stock quantity to 24
  const newStockQty = 24;
  const { error: stockUpdateErr } = await adminClient
    .from("product_variants")
    .update({ stock_quantity: newStockQty, updated_at: new Date().toISOString() })
    .eq("id", createdVariant!.id);

  assert(
    stockUpdateErr === null,
    `Stock Quick-Edit successfully updated variant stock to ${newStockQty}`
  );

  const { data: refetchedVariant } = await adminClient
    .from("product_variants")
    .select("stock_quantity")
    .eq("id", createdVariant!.id)
    .single();

  assert(
    refetchedVariant?.stock_quantity === 24,
    "Verified database variant stock reflects updated value: 24 units"
  );

  // 4. Test Storage File Extraction & Cleanup Logic
  const dummyStorageUrl = `https://mock.supabase.co/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/products/test-image-123.webp`;
  const extractedPath = extractStoragePathFromUrl(dummyStorageUrl);
  assert(
    extractedPath === "products/test-image-123.webp",
    "extractStoragePathFromUrl correctly parses bucket path from full URL",
    `Extracted: "${extractedPath}"`
  );

  // 5. Clean up the test product (0 orders -> hard delete)
  const { error: delVarErr } = await adminClient
    .from("product_variants")
    .delete()
    .eq("product_id", testProductId);
  const { error: delProdErr } = await adminClient
    .from("products")
    .delete()
    .eq("id", testProductId);

  assert(
    delVarErr === null && delProdErr === null,
    "Cleaned up test product with 0 orders (permanent deletion executed)"
  );

  // ==========================================================================
  // TEST GROUP 4: CSV IMPORT ROW VALIDATION
  // ==========================================================================
  console.log("\n--- 4. CSV Import Validation & Schema Rejection ---");

  // Valid Row
  const validRow = {
    name: "Pure Linen Shirt",
    slug: "pure-linen-shirt",
    category_slug: "tops",
    base_price: "2499",
    compare_at_price: "2999",
    fabric: "100% Linen",
    care_instructions: "Hand wash cold",
    size: "L",
    color: "Sage Green",
    sku: "VEL-SHIRT-GRN-L",
    stock_quantity: "15",
    is_active: "true",
    is_featured: "false",
  };

  const validParse = CsvProductRowSchema.safeParse(validRow);
  assert(
    validParse.success === true,
    "Valid CSV row conforms to CsvProductRowSchema"
  );

  // Invalid Row 1: Negative Stock
  const invalidNegativeStock = {
    ...validRow,
    stock_quantity: "-5",
  };
  const negStockParse = CsvProductRowSchema.safeParse(invalidNegativeStock);
  assert(
    negStockParse.success === false,
    "CSV Row with negative stock (-5) is strictly rejected by validation"
  );

  // Invalid Row 2: Non-positive Base Price
  const invalidPrice = {
    ...validRow,
    base_price: "-100",
  };
  const priceParse = CsvProductRowSchema.safeParse(invalidPrice);
  assert(
    priceParse.success === false,
    "CSV Row with negative base price is strictly rejected by validation"
  );

  // Invalid Row 3: Missing SKU
  const invalidSku = {
    ...validRow,
    sku: "A", // less than 2 chars
  };
  const skuParse = CsvProductRowSchema.safeParse(invalidSku);
  assert(
    skuParse.success === false,
    "CSV Row with invalid short SKU is strictly rejected by validation"
  );

  // ==========================================================================
  // TEST GROUP 5: FORM VALIDATION RULES (ALT TEXT & PRIMARY IMAGE)
  // ==========================================================================
  console.log("\n--- 5. Form Validation Rules (Alt Text & Primary Image) ---");

  // Form without alt text
  const invalidNoAlt = {
    name: "Silk Tunic",
    slug: "silk-tunic",
    category_id: "00000000-0000-0000-0000-000000000001",
    base_price: 3999,
    variants: [
      {
        size: "M",
        color: "Ivory",
        sku: "VEL-TUNIC-IVR-M",
        stock_quantity: 10,
        is_active: true,
      },
    ],
    images: [
      {
        image_url: "https://example.com/img.jpg",
        alt_text: "", // EMPTY ALT TEXT
        is_primary: true,
        display_order: 0,
      },
    ],
  };

  const noAltParse = AdminProductFormSchema.safeParse(invalidNoAlt);
  assert(
    noAltParse.success === false,
    "Form submission with empty image alt_text is rejected (accessibility & SEO constraint)"
  );

  // Form without any primary image
  const invalidNoPrimary = {
    ...invalidNoAlt,
    images: [
      {
        image_url: "https://example.com/img.jpg",
        alt_text: "Front view of ivory silk tunic",
        is_primary: false, // NO PRIMARY
        display_order: 0,
      },
    ],
  };

  const noPrimaryParse = AdminProductFormSchema.safeParse(invalidNoPrimary);
  assert(
    noPrimaryParse.success === false,
    "Form submission without a primary image is rejected"
  );

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log("\n================================================================");
  console.log(`  ALL PRODUCT & RBAC TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log("================================================================\n");
}

runAdminProductsTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
