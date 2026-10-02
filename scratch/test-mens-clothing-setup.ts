export {};

/**
 * Verification Test Suite for Men's Clothing Navigation & Setup
 * 
 * Tests:
 * 1. Category Hierarchy & 2-Level Limit: Men top-level + 4 subcategories
 * 2. Navigation Query: getNavigationCategories() includes Men & subcategories
 * 3. Size Charts: Category-level size charts exist & load for all 4 subcategories
 * 4. Placeholder Products Safety:
 *    - All placeholder products have is_active: false
 *    - All variants have is_active: false
 *    - All placeholder products have "DRAFT —" prefix
 * 5. Live Storefront Isolation:
 *    - Live shop queries (is_active: true) return 0 draft products
 * 6. Sizing measurements validity (S, M, L, XL, XXL)
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
  console.log("       TESTING MEN'S CLOTHING SETUP & REGRESSION CHECKS        ");
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

  // --- Test 1: Category Hierarchy in DB ---
  console.log("\n[Test 1] Category Hierarchy in DB:");
  const { data: categories, error: catErr } = await admin
    .from("categories")
    .select("id, name, slug, parent_id, display_order, is_active");

  assert(!catErr && Boolean(categories), "Categories table queried without error");

  const menCategory = categories?.find((c) => c.slug === "men");
  assert(Boolean(menCategory), "Men category exists in DB (slug: men)");
  assert(menCategory?.parent_id === null, "Men is a top-level category (parent_id is null)");

  const menSubCategories = categories?.filter((c) => c.parent_id === menCategory?.id) || [];
  assert(menSubCategories.length === 4, `Men has exactly 4 subcategories (Found ${menSubCategories.length})`);

  const expectedSubSlugs = ["men-shirts", "men-kurtas", "men-t-shirts", "men-bottoms"];
  const actualSubSlugs = menSubCategories.map((s) => s.slug);
  const allExpectedFound = expectedSubSlugs.every((slug) => actualSubSlugs.includes(slug));
  assert(allExpectedFound, `All expected subcategories present: ${expectedSubSlugs.join(", ")}`);

  // Verify 2-level limit: none of the men's subcategories have children
  const subCategoryIds = menSubCategories.map((s) => s.id);
  const thirdLevel = categories?.filter((c) => c.parent_id && subCategoryIds.includes(c.parent_id));
  assert(thirdLevel?.length === 0, "Strict 2-level nesting limit enforced (no 3rd-level categories)");

  // --- Test 2: getNavigationCategories() Query Output ---
  console.log("\n[Test 2] getNavigationCategories() Output:");
  const { getNavigationCategories } = await import("../features/navigation/queries/get-navigation-categories");
  const navCategories = await getNavigationCategories();

  const menNav = navCategories.find((c) => c.slug === "men");
  assert(Boolean(menNav), "getNavigationCategories() contains 'Men'");
  assert(menNav?.subcategories?.length === 4, `'Men' nav has 4 subcategories in getNavigationCategories()`);
  
  const navSubNames = menNav?.subcategories?.map((s) => s.name) || [];
  assert(
    navSubNames.includes("Shirts") &&
    navSubNames.includes("Kurtas") &&
    navSubNames.includes("T-Shirts") &&
    navSubNames.includes("Bottoms"),
    `Subcategories correctly named: Shirts, Kurtas, T-Shirts, Bottoms (Got: ${navSubNames.join(", ")})`
  );

  // --- Test 3: Size Charts Setup ---
  console.log("\n[Test 3] Size Charts for Men's Categories:");
  const { data: sizeCharts, error: scErr } = await admin
    .from("size_charts")
    .select("id, name, category_id, chart_data, measurement_unit")
    .in("category_id", subCategoryIds);

  assert(!scErr && Boolean(sizeCharts), "Queried size_charts table without error");
  assert(sizeCharts?.length === 4, `Found size charts for all 4 subcategories (Found ${sizeCharts?.length})`);

  // Test individual size chart resolution via getSizeChart query
  const { getSizeChart } = await import("../features/products/queries/get-size-chart");
  for (const sub of menSubCategories) {
    const chart = await getSizeChart("00000000-0000-0000-0000-000000000000", sub.id);
    assert(
      Boolean(chart) && chart.rows.length >= 5,
      `Size chart resolved for '${sub.name}': has ${chart?.rows?.length} size rows`
    );
    const sizes = chart?.rows?.map((r) => r.Size);
    const hasAllSizes = ["S", "M", "L", "XL", "XXL"].every((sz) => sizes?.includes(sz));
    assert(hasAllSizes, `'${sub.name}' size chart contains standard S-XXL sizes`);
  }

  // --- Test 4: Placeholder Draft Products Safety & Deactivation ---
  console.log("\n[Test 4] Placeholder Draft Products Safety:");
  const { data: draftProds, error: dpErr } = await admin
    .from("products")
    .select("id, name, slug, is_active, category_id")
    .in("category_id", subCategoryIds);

  assert(!dpErr && Boolean(draftProds), "Queried products in men's subcategories without error");
  assert(
    (draftProds?.length || 0) >= 8,
    `Found at least 8 placeholder draft products (Found ${draftProds?.length})`
  );

  const allDeactivated = draftProds?.every((p) => p.is_active === false);
  assert(allDeactivated === true, "ALL draft products have is_active: false");

  const allDraftPrefix = draftProds?.every((p) => p.name.startsWith("DRAFT —"));
  assert(allDraftPrefix === true, "ALL draft products have 'DRAFT —' prefix in name");

  // Check variants deactivation
  const draftProdIds = draftProds?.map((p) => p.id) || [];
  const { data: draftVariants, error: dvErr } = await admin
    .from("product_variants")
    .select("id, product_id, is_active, size, color")
    .in("product_id", draftProdIds);

  if (dvErr) {
    console.error("dvErr details:", dvErr);
  }
  assert(!dvErr && Boolean(draftVariants), "Queried variants for draft products without error");
  assert((draftVariants?.length || 0) > 0, `Found ${draftVariants?.length} variants for draft products`);

  const allVariantsDeactivated = draftVariants?.every((v) => v.is_active === false);
  assert(allVariantsDeactivated === true, "ALL draft product variants have is_active: false");

  // --- Test 5: Live Storefront Isolation ---
  console.log("\n[Test 5] Live Storefront Isolation (Customer-Facing Queries):");
  // Customer-facing active products query
  const { data: activeStorefrontProds } = await admin
    .from("products")
    .select("id, name, slug")
    .eq("is_active", true)
    .in("category_id", subCategoryIds);

  assert(
    activeStorefrontProds?.length === 0,
    `Live customer-facing product queries return 0 draft men's products (Returned: ${activeStorefrontProds?.length})`
  );

  // Shop query verification
  const { getProducts } = await import("../features/products/queries/get-products");
  const shopResult = await getProducts({ category: "men" });
  assert(
    shopResult.products.length === 0,
    `getProducts({ category: 'men' }) returns 0 active products (Returned: ${shopResult.products.length})`
  );

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
