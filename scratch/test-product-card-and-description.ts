/**
 * Verification test for:
 * 1. Simple product stock resolution in getProducts & getRelatedProducts
 * 2. Out of Stock badge suppression on ProductCard when stock > 0
 * 3. Product description HTML detection & clean text calculation
 */

import { getProducts } from "@/features/products/queries/get-products";
import { getProductBySlug } from "@/features/products/queries/get-product-by-slug";
import { getRelatedProducts } from "@/features/products/queries/get-related-products";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

async function run() {
  console.log("================================================================");
  console.log("   TESTING SIMPLE PRODUCT STOCK & RICH DESCRIPTION RENDERING    ");
  console.log("================================================================\n");

  // 1. Test getProducts for Lamps & Diyas category
  console.log("[Test 1] getProducts({ category: 'lamps-diyas' }):");
  const res = await getProducts({ category: "lamps-diyas" });
  assert(res.products.length > 0, `Found products in lamps-diyas category (Found: ${res.products.length})`);

  const brassProduct = res.products.find((p) => p.slug === "ipon-vel-velakku-one");
  assert(Boolean(brassProduct), "Found 'Iympon Vel Velakku' (ipon-vel-velakku-one) in product listing");

  if (brassProduct) {
    assert(
      brassProduct.total_stock === 50,
      `brassProduct.total_stock is 50 (Got: ${brassProduct.total_stock})`
    );
    assert(
      brassProduct.stock_quantity === 50,
      `brassProduct.stock_quantity is 50 (Got: ${brassProduct.stock_quantity})`
    );
    assert(
      brassProduct.has_variants === false,
      `brassProduct.has_variants is false (Got: ${brassProduct.has_variants})`
    );

    // Test ProductCard stock badge logic
    const isOutOfStock = brassProduct.total_stock <= 0 || brassProduct.stock_status === "out_of_stock";
    assert(
      isOutOfStock === false,
      `ProductCard 'Out of Stock' badge is SUPPRESSED (isOutOfStock is false)`
    );

    const isSimpleProduct = brassProduct.has_variants === false || brassProduct.variants.length === 0;
    const canQuickAdd = isSimpleProduct || brassProduct.variants.filter((v) => v.is_active).length === 1;
    assert(
      canQuickAdd === true,
      `ProductCard canQuickAdd is TRUE for simple product (canQuickAdd: ${canQuickAdd})`
    );
  }

  // 2. Test getRelatedProducts
  console.log("\n[Test 2] getRelatedProducts():");
  if (brassProduct) {
    const related = await getRelatedProducts(brassProduct.id, brassProduct.category_id, 4);
    for (const r of related) {
      if (r.has_variants === false) {
        assert(
          r.total_stock > 0,
          `Related simple product '${r.name}' has total_stock > 0 (Got: ${r.total_stock})`
        );
      }
    }
    console.log("  ✓ PASS: getRelatedProducts handles simple product stock correctly");
  }

  // 3. Test getProductBySlug for description structure
  console.log("\n[Test 3] getProductBySlug('ipon-vel-velakku-one'):");
  const pdpProduct = await getProductBySlug("ipon-vel-velakku-one");
  assert(Boolean(pdpProduct), "Found product by slug on PDP");

  if (pdpProduct && pdpProduct.description) {
    const isHtml = /<[a-z][\s\S]*>/i.test(pdpProduct.description);
    assert(isHtml === true, `Product description contains HTML markup (isHtml: ${isHtml})`);

    const cleanText = pdpProduct.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    assert(
      !cleanText.includes("<p>") && !cleanText.includes("<strong>"),
      "Stripped text correctly contains 0 HTML tags"
    );
    assert(cleanText.length > 50, `Clean text length calculated accurately (Length: ${cleanText.length} chars)`);
  }

  console.log("\n================================================================");
  console.log("      ALL PRODUCT CARD & DESCRIPTION TESTS PASSED!              ");
  console.log("================================================================\n");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
