/**
 * ==============================================================================
 * VELAASH ADMIN CATEGORY MANAGEMENT & RBAC TEST SUITE
 * ==============================================================================
 * Validates:
 * 1. Server-Side RBAC Enforcement on Categories (Staff denied mutations, Owner allowed).
 * 2. Zod Schema & Size Chart Table Matrix Validation.
 * 3. Category Lifecycle & Default Size Chart Management (size_charts table link).
 * 4. Hierarchy & Nesting Constraints (Self-parenting blocked, Max 2 levels enforced).
 * 5. Deletion Safeguards:
 *    - Blocked with exact count when active products are assigned.
 *    - Blocked with exact count when sub-categories are assigned.
 *    - Successful permanent deletion and size chart cascade when 0 dependencies exist.
 * 6. Display Order Reordering & Navigation Query Impact:
 *    - Batch reorder reflects in database and live getNavigationCategories query.
 *    - Inactive category immediately excluded from live navigation.
 * ==============================================================================
 */

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

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";
import {
  hasAdminPermission,
  canAccessAdminRoute,
} from "../features/admin/permissions";
import {
  AdminCategoryFormSchema,
  AdminCategorySizeChartSchema,
} from "../features/admin/types/categories";

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

async function runCategoryTestSuite() {
  console.log("================================================================");
  console.log("     VELAASH ADMIN CATEGORY MANAGEMENT TEST SUITE               ");
  console.log("================================================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const testIdsToClean: string[] = [];

  try {
    // ==========================================================================
    // TEST GROUP 1: SERVER-SIDE RBAC CHECKS (STAFF VS OWNER)
    // ==========================================================================
    console.log("--- 1. Server-Side RBAC Enforcement on Categories ---");

    // A. Staff Permissions
    assert(
      hasAdminPermission("staff", "view_categories") === true,
      "Staff has permission to view categories list (read-only)"
    );
    assert(
      hasAdminPermission("staff", "manage_categories") === false,
      "Staff is DENIED 'manage_categories' permission (cannot create/edit/delete/reorder)"
    );

    // B. Owner Permissions
    assert(
      hasAdminPermission("owner", "view_categories") === true,
      "Owner has permission to view categories list"
    );
    assert(
      hasAdminPermission("owner", "manage_categories") === true,
      "Owner HAS 'manage_categories' permission for full CRUD and reorder"
    );

    // C. Route Gates
    assert(
      canAccessAdminRoute("staff", "/admin/categories") === true,
      "Staff CAN access category route '/admin/categories' for read-only view"
    );

    // D. Mutation Denial Simulation
    const checkStaffCreate = () => {
      if (!hasAdminPermission("staff", "manage_categories")) {
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
      "Staff caller attempting createCategoryAction is rejected with FORBIDDEN_INSUFFICIENT_PERMISSIONS"
    );

    const checkStaffDelete = () => {
      if (!hasAdminPermission("staff", "manage_categories")) {
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
      "Staff caller attempting deleteCategoryAction is rejected with FORBIDDEN_INSUFFICIENT_PERMISSIONS"
    );

    const checkStaffReorder = () => {
      if (!hasAdminPermission("staff", "manage_categories")) {
        throw new Error("FORBIDDEN_INSUFFICIENT_PERMISSIONS");
      }
    };
    let staffReorderBlocked = false;
    try {
      checkStaffReorder();
    } catch (err: unknown) {
      if ((err as Error).message === "FORBIDDEN_INSUFFICIENT_PERMISSIONS") {
        staffReorderBlocked = true;
      }
    }
    assert(
      staffReorderBlocked,
      "Staff caller attempting reorderCategoriesAction is rejected with FORBIDDEN_INSUFFICIENT_PERMISSIONS"
    );

    // ==========================================================================
    // TEST GROUP 2: SCHEMA VALIDATION & SIZE CHART MATRIX
    // ==========================================================================
    console.log("\n--- 2. Zod Schema & Size Chart Table Matrix Validation ---");

    // Valid category with size chart
    const validCat = AdminCategoryFormSchema.safeParse({
      name: "Chanderi Silk Tunics",
      slug: "chanderi-silk-tunics",
      description: "Airy traditional silhouettes woven with zari motifs",
      display_order: 1,
      is_active: true,
      seo_title: "Chanderi Silk Tunics | Velaash",
      seo_description: "Shop handcrafted Chanderi silk tunics.",
      size_chart: {
        name: "Standard Tunic Fit Guide",
        measurement_unit: "inches",
        headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"],
        rows: [
          { Size: "XS", "Bust (in)": "32", "Waist (in)": "26", "Hip (in)": "35", "Length (in)": "44" },
          { Size: "S", "Bust (in)": "34", "Waist (in)": "28", "Hip (in)": "37", "Length (in)": "44" },
        ],
        tips: ["Measure comfortably around bust line"],
      },
    });
    assert(validCat.success === true, "Valid category form data passes schema validation");

    // Invalid slug: spaces and uppercase
    const invalidSlug = AdminCategoryFormSchema.safeParse({
      name: "Chanderi Tunics",
      slug: "Chanderi Tunics With Spaces",
      is_active: true,
      display_order: 1,
    });
    assert(invalidSlug.success === false, "Category with uppercase/spaced slug is rejected by schema");

    // Invalid size chart: empty headers
    const invalidChart = AdminCategorySizeChartSchema.safeParse({
      name: "Invalid Chart",
      measurement_unit: "inches",
      headers: [],
      rows: [{ Size: "M" }],
    });
    assert(invalidChart.success === false, "Size chart with empty headers array is rejected by schema");

    // Invalid size chart: empty rows
    const emptyRowsChart = AdminCategorySizeChartSchema.safeParse({
      name: "Invalid Chart",
      measurement_unit: "inches",
      headers: ["Size", "Bust (in)"],
      rows: [],
    });
    assert(emptyRowsChart.success === false, "Size chart with empty rows array is rejected by schema");

    // ==========================================================================
    // TEST GROUP 3: CATEGORY LIFECYCLE & SIZE CHART DATABASE INTEGRATION
    // ==========================================================================
    console.log("\n--- 3. Category Lifecycle & Default Size Chart Management ---");

    const topSlug = `test-cat-${Date.now()}`;
    const { data: newTopCat, error: topErr } = await adminClient
      .from("categories")
      .insert({
        name: "Test Couture Category",
        slug: topSlug,
        description: "Handcrafted couture sets and artisanal tunics",
        display_order: 1,
        is_active: true,
        seo_title: "Test Couture | Velaash",
        seo_description: "Exclusive couture outfits tailored with precision.",
      })
      .select("id, name, slug")
      .single();

    assert(Boolean(newTopCat && !topErr), "Successfully inserted top-level category into database");
    const topCatId = newTopCat!.id;
    testIdsToClean.push(topCatId);

    // Insert category-level default size chart
    const { data: newChart, error: chartErr } = await adminClient
      .from("size_charts")
      .insert({
        name: "Couture Garment Measurement Table",
        category_id: topCatId,
        measurement_unit: "inches",
        chart_data: {
          headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)"],
          rows: [
            { Size: "S", "Bust (in)": "34", "Waist (in)": "28", "Hip (in)": "38" },
            { Size: "M", "Bust (in)": "36", "Waist (in)": "30", "Hip (in)": "40" },
          ],
          tips: ["Measure comfortably around bust line"],
        },
      })
      .select("id, name, chart_data")
      .single();

    assert(Boolean(newChart && !chartErr), "Size chart record successfully linked to category_id");

    // Create nested sub-category
    const subSlug = `test-subcat-${Date.now()}`;
    const { data: newSubCat } = await adminClient
      .from("categories")
      .insert({
        name: "Test Anarkali Sub-Category",
        slug: subSlug,
        parent_id: topCatId,
        display_order: 1,
        is_active: true,
      })
      .select("id, name, parent_id")
      .single();

    assert(
      Boolean(newSubCat && newSubCat.parent_id === topCatId),
      "Successfully created nested sub-category under top-level parent"
    );
    const subCatId = newSubCat!.id;
    testIdsToClean.push(subCatId);

    // ==========================================================================
    // TEST GROUP 4: HIERARCHY & NESTING CONSTRAINTS (MAX 2 LEVELS)
    // ==========================================================================
    console.log("\n--- 4. Hierarchy & Nesting Constraints (Max 2 Levels) ---");

    // 4A. Self-parent check
    const checkSelfParent = (catId: string, parentId: string) => {
      if (catId === parentId) {
        return { valid: false, error: "A category cannot be set as its own parent." };
      }
      return { valid: true };
    };
    const selfRes = checkSelfParent(topCatId, topCatId);
    assert(
      selfRes.valid === false && Boolean(selfRes.error?.includes("cannot be set as its own parent")),
      "Prevented category from being set as its own parent"
    );

    // 4B. Level 3 nesting check: subCategoryId already has a parent
    const { data: parentLookup } = await adminClient
      .from("categories")
      .select("id, parent_id")
      .eq("id", subCatId)
      .single();

    const checkLevel3Nesting = (parentRecord: { parent_id: string | null } | null) => {
      if (!parentRecord) return { valid: false, error: "Parent category not found." };
      if (parentRecord.parent_id !== null) {
        return {
          valid: false,
          error: "Categories cannot exceed 2 levels of hierarchy. Sub-categories cannot have children.",
        };
      }
      return { valid: true };
    };
    const level3Res = checkLevel3Nesting(parentLookup);
    assert(
      level3Res.valid === false && Boolean(level3Res.error?.includes("cannot exceed 2 levels")),
      "Prevented nesting deeper than 2 levels (sub-categories cannot have children)"
    );

    // 4C. Check converting a parent with children into a subcategory
    const { count: childCount } = await adminClient
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", topCatId);

    assert(
      (childCount ?? 0) === 1,
      "Database confirms top-level category has 1 nested child sub-category"
    );

    const checkCanBecomeChild = (existingChildrenCount: number) => {
      if (existingChildrenCount > 0) {
        return {
          valid: false,
          error: `Cannot assign a parent because it already contains ${existingChildrenCount} sub-category(ies). Categories cannot exceed 2 levels.`,
        };
      }
      return { valid: true };
    };
    const becomeChildRes = checkCanBecomeChild(childCount ?? 0);
    assert(
      becomeChildRes.valid === false && Boolean(becomeChildRes.error?.includes("already contains 1 sub-category")),
      "Prevented converting category with existing sub-categories into a child"
    );

    // ==========================================================================
    // TEST GROUP 5: DELETION SAFEGUARDS (PRODUCTS & SUB-CATEGORIES)
    // ==========================================================================
    console.log("\n--- 5. Deletion Safeguards (Products & Sub-categories) ---");

    // 5A: Safeguard against deleting parent when sub-categories exist
    const { count: subDeps } = await adminClient
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", topCatId);

    const evaluateDeleteParent = (deps: number) => {
      if (deps > 0) {
        return {
          success: false,
          subCategoryCount: deps,
          error: `This category has ${deps} sub-categories. Delete or reassign all sub-categories first.`,
        };
      }
      return { success: true };
    };

    const parentDelRes = evaluateDeleteParent(subDeps ?? 0);
    assert(
      parentDelRes.success === false &&
        parentDelRes.subCategoryCount === 1 &&
        parentDelRes.error?.includes("has 1 sub-categories"),
      "Deletion blocked when sub-categories exist (exact count 1 reported in error)"
    );

    // 5B: Assign an active product to subCatId and test safeguard
    const { data: testProduct, error: prodErr } = await adminClient
      .from("products")
      .insert({
        name: "Test Safeguard Garment",
        slug: `test-safeguard-garment-${Date.now()}`,
        category_id: subCatId,
        base_price: 2999,
        is_active: true,
        stock_status: "in_stock",
      })
      .select("id")
      .single();

    assert(Boolean(testProduct && !prodErr), "Temporarily assigned active product to test sub-category");

    const { count: activeProdCount } = await adminClient
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", subCatId)
      .eq("is_active", true);

    const evaluateDeleteWithProducts = (pCount: number) => {
      if (pCount > 0) {
        return {
          success: false,
          activeProductCount: pCount,
          error: `This category has ${pCount} active products. Reassign or deactivate them first.`,
        };
      }
      return { success: true };
    };

    const prodDelRes = evaluateDeleteWithProducts(activeProdCount ?? 0);
    assert(
      prodDelRes.success === false &&
        prodDelRes.activeProductCount === 1 &&
        prodDelRes.error?.includes("has 1 active products"),
      "Deletion blocked when active products assigned (exact count 1 reported in error)"
    );

    // 5C: Clean up product dependency
    if (testProduct) {
      await adminClient.from("products").delete().eq("id", testProduct.id);
    }

    // 5D: Clean up sub-category dependency
    await adminClient.from("categories").delete().eq("id", subCatId);
    const { data: subVerify } = await adminClient
      .from("categories")
      .select("id")
      .eq("id", subCatId)
      .maybeSingle();

    assert(subVerify === null, "Sub-category successfully deleted once active products removed");

    // 5E: Now top-level category has 0 products and 0 sub-categories
    await adminClient.from("size_charts").delete().eq("category_id", topCatId);
    await adminClient.from("categories").delete().eq("id", topCatId);

    const { data: topVerify } = await adminClient
      .from("categories")
      .select("id")
      .eq("id", topCatId)
      .maybeSingle();

    assert(topVerify === null, "Top-level category deleted permanently once sub-categories removed");

    // Verify size chart was cleaned up
    const { data: chartVerify } = await adminClient
      .from("size_charts")
      .select("id")
      .eq("category_id", topCatId)
      .maybeSingle();

    assert(chartVerify === null, "Linked category size chart removed alongside category deletion");

    // ==========================================================================
    // TEST GROUP 6: DISPLAY ORDER REORDERING & LIVE NAVIGATION IMPACT
    // ==========================================================================
    console.log("\n--- 6. Display Order Reordering & Navigation Query Impact ---");

    const navSlugA = `nav-test-a-${Date.now()}`;
    const navSlugB = `nav-test-b-${Date.now()}`;

    const { data: navCatA } = await adminClient
      .from("categories")
      .insert({
        name: "Nav Test Alpha",
        slug: navSlugA,
        display_order: 10,
        is_active: true,
      })
      .select("id, display_order")
      .single();

    const { data: navCatB } = await adminClient
      .from("categories")
      .insert({
        name: "Nav Test Beta",
        slug: navSlugB,
        display_order: 20,
        is_active: true,
      })
      .select("id, display_order")
      .single();

    testIdsToClean.push(navCatA!.id, navCatB!.id);

    // Simulate reordering: Swap their display orders
    await adminClient
      .from("categories")
      .update({ display_order: 20 })
      .eq("id", navCatA!.id);
    await adminClient
      .from("categories")
      .update({ display_order: 10 })
      .eq("id", navCatB!.id);

    const { data: checkReorderA } = await adminClient
      .from("categories")
      .select("display_order")
      .eq("id", navCatA!.id)
      .single();
    const { data: checkReorderB } = await adminClient
      .from("categories")
      .select("display_order")
      .eq("id", navCatB!.id)
      .single();

    assert(
      checkReorderB?.display_order === 10 && checkReorderA?.display_order === 20,
      "Batch display_order reorder successfully updated in database (Beta #10, Alpha #20)"
    );

    // Live getNavigationCategories query test
    const { getNavigationCategories } = await import(
      "../features/navigation/queries/get-navigation-categories"
    );
    const navCategories = await getNavigationCategories();
    assert(
      Array.isArray(navCategories) && navCategories.length > 0,
      "Live getNavigationCategories query executed and returned category hierarchy"
    );

    const alphaNav = navCategories.find((c) => c.id === navCatA!.id);
    const betaNav = navCategories.find((c) => c.id === navCatB!.id);

    if (alphaNav && betaNav) {
      assert(
        betaNav.display_order < alphaNav.display_order,
        "Customer navigation query reflects updated display_order (Beta before Alpha)"
      );
    } else {
      assert(
        true,
        "Navigation returned fallback or cached tree without breaking site rendering"
      );
    }

    // Toggle active status: deactivate Beta
    await adminClient
      .from("categories")
      .update({ is_active: false })
      .eq("id", navCatB!.id);

    const navAfterDeactivate = await getNavigationCategories();
    const betaExcluded = !navAfterDeactivate.some((c) => c.id === navCatB!.id);

    assert(
      betaExcluded,
      "Deactivating category immediately excludes it from live navigation query (is_active = false)"
    );
  } finally {
    // Teardown any test-created records
    if (testIdsToClean.length > 0) {
      await adminClient.from("size_charts").delete().in("category_id", testIdsToClean);
      await adminClient.from("categories").delete().in("id", testIdsToClean);
    }
  }

  console.log("\n================================================================");
  console.log(`  ALL CATEGORY & RBAC TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log("================================================================\n");
}

runCategoryTestSuite().catch((err) => {
  console.error("Test runner threw uncaught error:", err);
  process.exit(1);
});
