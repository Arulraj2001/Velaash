/**
 * SEO Infrastructure Integration Test Script
 *
 * Run with: npx tsx scratch/test-seo-infrastructure.ts
 * Requires: dev server running at http://localhost:3000 (npm run dev)
 *
 * Tests:
 *   1. /sitemap.xml — valid XML, contains active products, excludes sensitive routes
 *   2. /robots.txt  — correct Disallow rules, sitemap reference present
 *   3. /api/feed/google-merchant — valid XML feed, correct INR pricing, availability
 *   4. Search Console meta tag — renders only when NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION is set
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? `\n     ${detail}` : ""}`);
    failed++;
  }
}

async function fetchText(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "*/*" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

// ─── 1. Sitemap ───────────────────────────────────────────────────────────────

async function testSitemap() {
  console.log("\n📋 1. Sitemap (/sitemap.xml)");
  const { status, body } = await fetchText("/sitemap.xml");

  ok("Returns HTTP 200", status === 200, `Got ${status}`);
  ok("Content-Type is XML", body.trimStart().startsWith("<?xml"), "Body doesn't start with <?xml");
  ok("Contains <urlset>", body.includes("<urlset"), "Missing <urlset> tag");

  // Must include static pages
  ok("Includes homepage URL", body.includes(`${BASE_URL}</loc>`) || body.includes(`<loc>${BASE_URL}<`), "");
  ok("Includes /shop", body.includes("/shop"), "");
  ok("Includes /about", body.includes("/about"), "");
  ok("Includes /faq", body.includes("/faq"), "");
  ok("Includes /privacy-policy", body.includes("/privacy-policy"), "");
  ok("Includes /terms-conditions", body.includes("/terms-conditions"), "");
  ok("Includes /size-guide", body.includes("/size-guide"), "");
  ok("Includes /shipping-returns", body.includes("/shipping-returns"), "");
  ok("Includes /track-order", body.includes("/track-order"), "");

  // MUST exclude these routes
  ok("Excludes /cart", !body.includes("<loc>" + BASE_URL + "/cart"), "Found /cart in sitemap");
  ok("Excludes /checkout", !body.includes("<loc>" + BASE_URL + "/checkout"), "Found /checkout");
  ok("Excludes /account", !body.includes("<loc>" + BASE_URL + "/account"), "Found /account");
  ok("Excludes /admin", !body.includes("<loc>" + BASE_URL + "/admin"), "Found /admin");
  ok("Excludes /api", !body.includes("<loc>" + BASE_URL + "/api"), "Found /api");
  ok("Excludes /order-confirmation", !body.includes("/order-confirmation"), "Found /order-confirmation");

  // Products and categories (if any exist in DB)
  const hasProducts = body.includes("/products/");
  const hasCategories = body.includes("/category/");
  if (hasProducts) {
    ok("Contains live product URLs (/products/...)", true);
  } else {
    console.log("  ℹ️  No active products in DB — product URLs section is empty (expected for fresh install)");
  }
  if (hasCategories) {
    ok("Contains live category URLs (/category/...)", true);
  } else {
    console.log("  ℹ️  No active categories in DB — category URLs section is empty");
  }

  // Validates lastmod format
  if (body.includes("<lastmod>")) {
    const lastmodMatch = body.match(/<lastmod>(.+?)<\/lastmod>/);
    if (lastmodMatch) {
      const isValidDate = !isNaN(Date.parse(lastmodMatch[1]));
      ok("lastmod dates are valid ISO format", isValidDate, `Found: ${lastmodMatch[1]}`);
    }
  }
}

// ─── 2. Robots.txt ────────────────────────────────────────────────────────────

async function testRobots() {
  console.log("\n🤖 2. Robots.txt (/robots.txt)");
  const { status, body } = await fetchText("/robots.txt");

  ok("Returns HTTP 200", status === 200, `Got ${status}`);
  ok("Contains User-Agent: *", body.includes("User-Agent: *"), "");
  ok("Allow: /", body.includes("Allow: /"), "");

  // Disallow checks
  ok("Disallows /cart", body.includes("Disallow: /cart"), "");
  ok("Disallows /checkout", body.includes("Disallow: /checkout"), "");
  ok("Disallows /account/", body.includes("Disallow: /account/"), "");
  ok("Disallows /admin/", body.includes("Disallow: /admin/"), "");
  ok("Disallows /api/", body.includes("Disallow: /api/"), "");
  ok("Disallows /order-confirmation/", body.includes("Disallow: /order-confirmation/"), "");

  // Sitemap reference
  ok("References sitemap URL", body.includes("Sitemap:") && body.includes("/sitemap.xml"), "");
  ok("Sitemap URL is absolute", body.includes("Sitemap: http"), "Sitemap URL must be absolute");
}

// ─── 3. Google Merchant Feed ──────────────────────────────────────────────────

async function testMerchantFeed() {
  console.log("\n🛍️  3. Google Merchant Center Feed (/api/feed/google-merchant)");
  const { status, body } = await fetchText("/api/feed/google-merchant");

  ok("Returns HTTP 200", status === 200, `Got ${status}`);
  ok("Starts with XML declaration", body.trimStart().startsWith("<?xml"), "");
  ok("Contains RSS 2.0 root element", body.includes('rss version="2.0"'), "");
  ok("Contains Google Shopping namespace (g:)", body.includes('xmlns:g="http://base.google.com/ns/1.0"'), "");
  ok("Contains <channel> element", body.includes("<channel>"), "");
  ok("Feed title is present", body.includes("<title>") && body.includes("Velaash"), "");

  // If products exist in DB
  if (body.includes("<item>")) {
    ok("Feed items present", true);
    ok("Contains g:id", body.includes("<g:id>"), "");
    ok("Contains g:title", body.includes("<g:title>"), "");
    ok("Contains g:price with INR currency", body.includes("INR</g:price>"), "Price missing INR suffix");
    ok("Contains g:availability", body.includes("<g:availability>"), "");
    ok("Availability values are valid", 
      body.includes("in stock") || body.includes("out of stock"),
      "Availability must be 'in stock' or 'out of stock'"
    );
    ok("Contains g:condition: new", body.includes("<g:condition>new</g:condition>"), "");
    ok("Contains g:brand: Velaash", body.includes("<g:brand>Velaash</g:brand>"), "");
    ok("Contains g:google_product_category", body.includes("<g:google_product_category>"), "");
    ok("Contains g:identifier_exists: no", body.includes("<g:identifier_exists>no</g:identifier_exists>"), "");

    // Verify no hardcoded localhost in prod links
    ok("Product links use BASE_URL (not localhost hardcoded)", 
      !body.includes("localhost") || BASE_URL.includes("localhost"),
      "Found localhost in links when BASE_URL is not localhost"
    );
  } else {
    console.log("  ℹ️  No active products in DB — feed is empty (expected for fresh install)");
    ok("Feed structure is valid XML even when empty", body.includes("</channel>"), "");
  }
}

// ─── 4. Search Console Verification Tag ──────────────────────────────────────

async function testSearchConsoleTag() {
  console.log("\n🔍 4. Search Console Verification Meta Tag");
  const { status, body } = await fetchText("/");

  ok("Homepage returns 200", status === 200, `Got ${status}`);

  const verificationEnvSet = Boolean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION);

  if (verificationEnvSet) {
    const verificationValue = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION!;
    ok(
      "google-site-verification meta tag rendered (env var is set)",
      body.includes('name="google-site-verification"') && body.includes(verificationValue),
      "Meta tag missing or content mismatch"
    );
  } else {
    // When not set, tag must NOT appear
    ok(
      "No google-site-verification tag when env var is unset (graceful skip)",
      !body.includes('name="google-site-verification"'),
      "Tag rendered even though NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION is not set"
    );
    console.log("  ℹ️  To test the positive case, set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=test123 and re-run");
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧪 Velaash SEO Infrastructure Tests`);
  console.log(`   Target: ${BASE_URL}`);
  console.log("─".repeat(50));

  try {
    await testSitemap();
    await testRobots();
    await testMerchantFeed();
    await testSearchConsoleTag();
  } catch (err) {
    console.error("\n💥 Fatal test error:", err);
    console.error("   Is the dev server running? (npm run dev)");
    process.exit(2);
  }

  console.log("\n" + "─".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
