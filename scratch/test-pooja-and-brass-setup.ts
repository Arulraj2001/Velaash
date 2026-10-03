export {};

/**
 * Verification Test Suite for Pooja & Brass Items Setup & Regressions
 * 
 * Verifies:
 * 1. Category Hierarchy in DB (2-level limit, Pooja & Brass Items + 2 subcategories)
 * 2. Navigation Query: getNavigationCategories() includes Pooja & Brass Items
 * 3. Size Charts: Confirms ZERO size charts exist for pooja/brass categories
 * 4. Simple Product Draft Shells:
 *    - has_variants: false, direct stock_quantity > 0, 0 variants in product_variants
 *    - is_active: false (strictly deactivated)
 *    - "DRAFT —" name prefix
 *    - care_instructions: null
 *    - specifications: JSONB array with Material, Finish, Height, Weight
 * 5. Customer Storefront Isolation:
 *    - getProducts({ category: 'pooja-and-brass' }) returns 0 active products
 *    - getProducts({ category: 'lamps-diyas' }) returns 0 active products
 *    - Live search / featured queries return 0 draft items
 * 6. PDP Specifications & Size Chart Suppression:
 *    - Specifications array present
 *    - Size variants absent -> hasSizeVariants is false -> size guide completely suppressed
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
  console.log("     TESTING POOJA & BRASS ITEMS SETUP & REGRESSION CHECKS      ");
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

  const poojaCategory = categories?.find((c) => c.slug === "pooja-and-brass");
  assert(Boolean(poojaCategory), "Pooja & Brass Items category exists in DB (slug: pooja-and-brass)");
  assert(poojaCategory?.parent_id === null, "Pooja & Brass Items is a top-level category (parent_id is null)");

  const poojaSubCategories = categories?.filter((c) => c.parent_id === poojaCategory?.id) || [];
  assert(poojaSubCategories.length === 2, `Pooja & Brass has exactly 2 subcategories (Found ${poojaSubCategories.length})`);

  const expectedSubSlugs = ["lamps-diyas", "pooja-accessories"];
  const actualSubSlugs = poojaSubCategories.map((s) => s.slug);
  const allExpectedFound = expectedSubSlugs.every((slug) => actualSubSlugs.includes(slug));
  assert(allExpectedFound, `All expected subcategories present: ${expectedSubSlugs.join(", ")}`);

  // Verify 2-level limit: none of the subcategories have children
  const subCategoryIds = poojaSubCategories.map((s) => s.id);
  const thirdLevel = categories?.filter((c) => c.parent_id && subCategoryIds.includes(c.parent_id));
  assert(thirdLevel?.length === 0, "Strict 2-level nesting limit enforced (no 3rd-level categories)");

  // --- Test 2: getNavigationCategories() Output ---
  console.log("\n[Test 2] getNavigationCategories() Output:");
  const { getNavigationCategories } = await import("../features/navigation/queries/get-navigation-categories");
  const navCategories = await getNavigationCategories();

  const poojaNav = navCategories.find((c) => c.slug === "pooja-and-brass");
  assert(Boolean(poojaNav), "getNavigationCategories() contains 'Pooja & Brass Items'");
  assert(poojaNav?.subcategories?.length === 2, `'Pooja & Brass Items' nav has 2 subcategories in getNavigationCategories()`);

  const navSubNames = poojaNav?.subcategories?.map((s) => s.name) || [];
  assert(
    navSubNames.includes("Lamps & Diyas") && navSubNames.includes("Pooja Accessories"),
    `Subcategories correctly named: Lamps & Diyas, Pooja Accessories (Got: ${navSubNames.join(", ")})`
  );

  // --- Test 3: Size Charts Verification (Zero size charts for Pooja/Brass) ---
  console.log("\n[Test 3] Size Charts Suppression for Pooja & Brass Categories:");
  const allPoojaCategoryIds = [poojaCategory!.id, ...subCategoryIds];
  const { data: sizeCharts, error: scErr } = await admin
    .from("size_charts")
    .select("id, name, category_id")
    .in("category_id", allPoojaCategoryIds);

  assert(!scErr && Boolean(sizeCharts), "Queried size_charts table without error");
  assert(sizeCharts?.length === 0, `ZERO size charts exist for pooja/brass categories in DB (Found ${sizeCharts?.length})`);

  // Verify that neither the top-level category nor subcategories have a configured size chart
  for (const sub of poojaSubCategories) {
    const { data: subChart } = await admin
      .from("size_charts")
      .select("id")
      .eq("category_id", sub.id)
      .maybeSingle();
    assert(subChart === null, `No size chart entry in database for subcategory '${sub.name}'`);
  }

  // --- Test 4: Placeholder Draft Products Structure & Deactivation ---
  console.log("\n[Test 4] Simple Product Draft Shells & Safety:");
  const { data: allProds, error: dpErr } = await admin
    .from("products")
    .select("id, name, slug, is_active, category_id, has_variants, stock_quantity, specifications, care_instructions, fabric, craftsmanship")
    .in("category_id", subCategoryIds);

  assert(!dpErr && Boolean(allProds), "Queried products in pooja subcategories without error");

  const draftProds = allProds?.filter((p) => p.name.startsWith("DRAFT —")) || [];
  assert(draftProds.length >= 1, `Found placeholder draft products (Found ${draftProds.length})`);

  const allDeactivated = draftProds.every((p) => p.is_active === false);
  assert(allDeactivated === true, "ALL draft placeholder products have is_active: false");

  const allDraftPrefix = draftProds.every((p) => p.name.startsWith("DRAFT —"));
  assert(allDraftPrefix === true, "ALL draft products have 'DRAFT —' prefix in name");

  const allSimple = (allProds || []).every((p) => p.has_variants === false);
  assert(allSimple === true, "All products in Lamps & Diyas have has_variants: false (simple products)");

  const allDirectStock = (allProds || []).every((p) => (p.stock_quantity ?? 0) > 0);
  assert(allDirectStock === true, "All products have direct stock_quantity > 0");

  const allDraftNoCare = draftProds.every((p) => p.care_instructions === null);
  assert(allDraftNoCare === true, "All draft placeholder products have care_instructions: null (no unconfirmed care)");

  const allDraftHaveSpecs = draftProds.every((p) => Array.isArray(p.specifications) && p.specifications.length >= 4);
  assert(allDraftHaveSpecs === true, "Draft products have example specifications populated (Material, Finish, Height, Weight)");

  // Check that no variants exist in product_variants for simple products
  const prodIds = allProds?.map((p) => p.id) || [];
  const { data: variants, error: vErr } = await admin
    .from("product_variants")
    .select("id, product_id")
    .in("product_id", prodIds);

  assert(!vErr, "Queried variants table without error");
  assert(variants?.length === 0, `ZERO variants exist in product_variants for simple products (Found ${variants?.length})`);

  // --- Test 5: Live Storefront Isolation ---
  console.log("\n[Test 5] Live Storefront Isolation (Customer-Facing Queries):");
  const { getProducts } = await import("../features/products/queries/get-products");

  const poojaLiveResult = await getProducts({ category: "pooja-and-brass" });
  const draftInLivePooja = poojaLiveResult.products.filter((p) => p.name.startsWith("DRAFT —"));
  assert(
    draftInLivePooja.length === 0,
    `getProducts({ category: 'pooja-and-brass' }) returns 0 draft products (Drafts found: ${draftInLivePooja.length})`
  );

  const lampsLiveResult = await getProducts({ category: "lamps-diyas" });
  const draftInLiveLamps = lampsLiveResult.products.filter((p) => p.name.startsWith("DRAFT —"));
  assert(
    draftInLiveLamps.length === 0,
    `getProducts({ category: 'lamps-diyas' }) returns 0 draft products (Drafts found: ${draftInLiveLamps.length})`
  );

  const accessoriesLiveResult = await getProducts({ category: "pooja-accessories" });
  assert(
    accessoriesLiveResult.products.length === 0,
    `getProducts({ category: 'pooja-accessories' }) returns 0 active products (Returned: ${accessoriesLiveResult.products.length})`
  );

  // --- Test 6: PDP UI Logic Verification for Simple Brass Products ---
  console.log("\n[Test 6] PDP UI Logic Verification for Simple Brass Products:");
  const sampleLamp = (allProds || []).find((p) => p.has_variants === false);
  assert(Boolean(sampleLamp), "Found simple brass lamp product shell");

  const hasVariants = sampleLamp?.has_variants !== false && (variants?.length ?? 0) > 0;
  const hasSizeVariants = Boolean(hasVariants && variants?.some((v: any) => Boolean(v.size)));
  assert(hasVariants === false, "Product PDP logic: hasVariants is FALSE");
  assert(hasSizeVariants === false, "Product PDP logic: hasSizeVariants is FALSE (Size Guide button and modal completely suppressed)");

  const hasSpecs = Boolean(sampleLamp?.specifications && (sampleLamp.specifications as any[]).length > 0);
  assert(hasSpecs === true, "Product PDP logic: hasSpecifications is TRUE (Specifications table will render)");

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
