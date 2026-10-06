import { getProductBySlug } from "../features/products/queries/get-product-by-slug";
import { getProducts } from "../features/products/queries/get-products";

async function testCache() {
  console.log("=== CACHE & DEDUPLICATION TEST ===");

  // First call (cold)
  const t0 = performance.now();
  await getProducts({ limit: 12 });
  const t1 = performance.now();
  console.log(`Cold call 1: ${(t1 - t0).toFixed(2)}ms`);

  // Second call (in-memory memoized via React cache in same request or warm)
  const t2 = performance.now();
  await getProducts({ limit: 12 });
  const t3 = performance.now();
  console.log(`Call 2 (in same execution context): ${(t3 - t2).toFixed(2)}ms`);

  // Slug cold vs warm
  const t4 = performance.now();
  await getProductBySlug("ipon-vel-velakku-one");
  const t5 = performance.now();
  console.log(`Cold PDP call: ${(t5 - t4).toFixed(2)}ms`);

  const t6 = performance.now();
  await getProductBySlug("ipon-vel-velakku-one");
  const t7 = performance.now();
  console.log(`Warm PDP call (deduplicated): ${(t7 - t6).toFixed(2)}ms`);
}

testCache().catch(console.error);
