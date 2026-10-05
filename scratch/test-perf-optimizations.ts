import { createAdminClient } from "../lib/supabase/admin";
import { getAdminDashboardData } from "../features/admin/queries/get-admin-dashboard";
import { getAdminProductsList } from "../features/admin/queries/get-admin-products";
import { getAdminOrders } from "../features/admin/queries/get-admin-orders";
import { getProductBySlug } from "../features/products/queries/get-product-by-slug";
import { getProducts } from "../features/products/queries/get-products";
import { getRelatedProducts } from "../features/products/queries/get-related-products";

async function runBenchmark() {
  console.log("=== VELAASH PERFORMANCE BENCHMARK ===");

  const fakeOwnerSession = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "owner@velaash.in",
    role: "owner" as const,
    name: "Owner",
    fullName: "Owner",
  };

  // 1. Benchmark Admin Dashboard Data (consolidated RPC)
  console.log("\n1. Testing getAdminDashboardData (consolidated RPC)...");
  const t0 = performance.now();
  const dashboard = await getAdminDashboardData(fakeOwnerSession);
  const t1 = performance.now();
  console.log(`✓ Dashboard completed in ${(t1 - t0).toFixed(1)}ms`);
  console.log(`  - Total orders: ${dashboard.operationalMetrics.totalOrdersCount}`);
  console.log(`  - Low stock: ${dashboard.operationalMetrics.lowStockCount}`);
  console.log(`  - Total revenue: ₹${dashboard.financialMetrics?.totalRevenue ?? 0}`);

  // 2. Benchmark Admin Products List (server-side pagination + in-filter)
  console.log("\n2. Testing getAdminProductsList (paginated)...");
  const t2 = performance.now();
  const adminProducts = await getAdminProductsList({ page: 1, pageSize: 20 });
  const t3 = performance.now();
  console.log(`✓ Admin products list completed in ${(t3 - t2).toFixed(1)}ms`);
  console.log(`  - Returned: ${adminProducts.products.length} products`);
  console.log(`  - Total count: ${adminProducts.totalCount}`);

  // 3. Benchmark Admin Orders (parallel count + query)
  console.log("\n3. Testing getAdminOrders (concurrent queries)...");
  const t4 = performance.now();
  const adminOrders = await getAdminOrders({ page: 1, pageSize: 20 });
  const t5 = performance.now();
  console.log(`✓ Admin orders completed in ${(t5 - t4).toFixed(1)}ms`);
  console.log(`  - Orders fetched: ${adminOrders.orders.length}`);
  console.log(`  - Needs action count: ${adminOrders.needsActionCount}`);

  // 4. Benchmark Storefront Products Catalog (getProducts)
  console.log("\n4. Testing getProducts (storefront catalog)...");
  const t6 = performance.now();
  const shopProducts = await getProducts({ limit: 12 });
  const t7 = performance.now();
  console.log(`✓ Storefront getProducts completed in ${(t7 - t6).toFixed(1)}ms`);
  console.log(`  - Products returned: ${shopProducts.products.length}`);
  console.log(`  - Total count: ${shopProducts.totalCount}`);

  // 5. Benchmark Product Details (getProductBySlug)
  if (shopProducts.products.length > 0) {
    const slug = shopProducts.products[0].slug;
    console.log(`\n5. Testing getProductBySlug (slug="${slug}")...`);
    const t8 = performance.now();
    const pdp = await getProductBySlug(slug);
    const t9 = performance.now();
    console.log(`✓ getProductBySlug completed in ${(t9 - t8).toFixed(1)}ms`);
    console.log(`  - Title: ${pdp?.name}`);
    console.log(`  - Variants: ${pdp?.variants?.length ?? 0}`);

    // 6. Benchmark Related Products
    console.log(`\n6. Testing getRelatedProducts...`);
    const t10 = performance.now();
    const related = await getRelatedProducts(pdp!.id, pdp?.category_id, 4);
    const t11 = performance.now();
    console.log(`✓ getRelatedProducts completed in ${(t11 - t10).toFixed(1)}ms`);
    console.log(`  - Related count: ${related.length}`);
  }

  console.log("\n=== ALL PERFORMANCE BENCHMARKS PASSED SUCCESSFULLY ===");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
