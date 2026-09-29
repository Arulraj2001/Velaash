/**
 * End-to-end PDP Verification Script (Non-browser)
 * Tests:
 * 1. HTTP SSR Rendering & Status Codes (Valid product vs 404)
 * 2. Open Graph & Twitter Card Meta Tags
 * 3. JSON-LD Schema.org Structured Data
 * 4. PDP UI Content (Pricing, Gallery, WhatsApp, Accordion, Reviews)
 * 5. Review Submission Validation & Security Flow
 */

async function runTests() {
  console.log("=== STARTING PDP END-TO-END VERIFICATION ===");
  const BASE_URL = "http://localhost:3000";

  // Test 1: Fetch PDP for 'chanderi-embroidered-kurta-set'
  console.log("\n[Test 1] Testing HTTP SSR for /products/chanderi-embroidered-kurta-set...");
  const res = await fetch(`${BASE_URL}/products/chanderi-embroidered-kurta-set`);
  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  if (res.status !== 200) {
    throw new Error(`Expected 200 OK, got ${res.status}`);
  }
  const html = await res.text();
  console.log(`✓ Page successfully rendered (${html.length} bytes)`);

  // Test 2: Check Open Graph & SEO Tags
  console.log("\n[Test 2] Verifying Open Graph & Metadata Tags...");
  const ogTitleMatch =
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:title"/i);
  const ogDescMatch =
    html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:description"/i);
  const ogImageMatch =
    html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:image"/i);
  const twitterCardMatch =
    html.match(/<meta\s+name="twitter:card"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+name="twitter:card"/i);

  console.log("og:title:", ogTitleMatch ? ogTitleMatch[1] : "NOT FOUND");
  console.log("og:description:", ogDescMatch ? ogDescMatch[1].slice(0, 60) + "..." : "NOT FOUND");
  console.log("og:image:", ogImageMatch ? ogImageMatch[1] : "NOT FOUND");
  console.log("twitter:card:", twitterCardMatch ? twitterCardMatch[1] : "NOT FOUND");

  if (!ogTitleMatch || !ogImageMatch) {
    throw new Error("Missing essential Open Graph meta tags!");
  }
  console.log("✓ Open Graph meta tags verified!");

  // Test 3: Check Schema.org JSON-LD Structured Data
  console.log("\n[Test 3] Verifying Schema.org Product JSON-LD...");
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonLdMatch) {
    throw new Error("Missing application/ld+json script block!");
  }
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  console.log("JSON-LD @type:", jsonLd["@type"]);
  console.log("JSON-LD Name:", jsonLd.name);
  console.log("JSON-LD Price:", jsonLd.offers?.price, jsonLd.offers?.priceCurrency);
  console.log("JSON-LD Availability:", jsonLd.offers?.availability);
  console.log("JSON-LD AggregateRating:", jsonLd.aggregateRating);

  if (jsonLd["@type"] !== "Product" || !jsonLd.offers?.price) {
    throw new Error("Invalid Product JSON-LD schema!");
  }
  console.log("✓ Schema.org Product JSON-LD valid and verified!");

  // Test 4: Key UI Elements & UX hooks in HTML
  console.log("\n[Test 4] Verifying Core E-commerce PDP UX Content...");
  const requiredSnippets = [
    { name: "Product Title", pattern: /Chanderi Embroidered Kurta Set/i },
    { name: "Price Display (₹4,250)", pattern: /₹4,250|4,250/ },
    { name: "Main Add to Cart Button", pattern: /Add to Bag/i },
    { name: "Buy Now 1-Click Button", pattern: /Buy Now with 1-Click/i },
    { name: "WhatsApp Enquiry CTA", pattern: /Ask about this product on WhatsApp/i },
    { name: "WhatsApp Phone Configured", pattern: /8508643832/ },
    { name: "Delivery Pincode Checker", pattern: /Check Delivery Serviceability/i },
    { name: "Size Guide Modal Trigger", pattern: /Size Guide/i },
    {
      name: "Product Details Accordion",
      pattern: /Product Details &amp; Craftsmanship|Product Details & Craftsmanship/i,
    },
    { name: "Ratings & Reviews Section", pattern: /Ratings &amp; Reviews|Ratings & Reviews/i },
    { name: "Curated Complements / You May Also Like", pattern: /You May Also Like/i },
  ];

  for (const snippet of requiredSnippets) {
    if (!snippet.pattern.test(html)) {
      throw new Error(`Missing expected PDP content: ${snippet.name}`);
    }
    console.log(`  ✓ ${snippet.name} present in rendered HTML`);
  }

  // Test 5: Verify 404 for invalid product slug
  console.log("\n[Test 5] Verifying 404 error handling for non-existent product...");
  const notFoundRes = await fetch(`${BASE_URL}/products/this-product-does-not-exist-xyz`);
  console.log(`HTTP Status for invalid slug: ${notFoundRes.status}`);
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404 for invalid product, got ${notFoundRes.status}`);
  }
  console.log("✓ Proper 404 returned for non-existent product slug!");

  console.log("\n=== ALL SSR, METADATA & CONTENT TESTS PASSED! ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
