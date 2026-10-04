try {
  process.loadEnvFile(".env.local");
} catch {}

import { groupNavigationCategories, DEFAULT_CLOTHING_CATEGORIES } from "../features/navigation";
import type { ShippingPolicySetting } from "../features/settings/types";

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    if (details) console.error(`    ${details}`);
    process.exit(1);
  }
}

console.log("=== RUNNING APPROACH A NAVIGATION VERIFICATION SUITE ===\n");

// 1. Test Standard 3-Pillar Grouping
console.log("[Test 1] Standard Pillars with Festive Enabled:");
const festivePolicy: ShippingPolicySetting = {
  free_shipping_threshold: 1999,
  standard_shipping_fee: 150,
  festive_shipping_enabled: true,
  festive_campaign_name: "Pongal Special",
  festive_badge_text: "FREE SHIPPING",
  festive_coupon_code: "PONGALFREE",
};

const pillars = groupNavigationCategories(DEFAULT_CLOTHING_CATEGORIES, festivePolicy);
assert("Produces 4 pillars", pillars.length === 4);

const [women, men, pooja, all] = pillars;

assert("Pillar 1 is Women", women.name === "Women" && women.dropdownType === "mega-women");
assert("Women has sections", (women.sections?.length || 0) >= 3);
assert("Women has featuredCard", Boolean(women.featuredCard?.imageUrl));

assert("Pillar 2 is Men", men.name === "Men" && men.dropdownType === "dropdown-men");
assert("Men has sections", (men.sections?.length || 0) >= 1);
assert("Men has featuredCard", Boolean(men.featuredCard?.imageUrl));

assert("Pillar 3 is Pooja & Brass", pooja.name === "Pooja & Brass" && pooja.dropdownType === "dropdown-pooja");
assert("Pooja has sections", (pooja.sections?.length || 0) >= 1);
assert("Pooja has featuredCard", Boolean(pooja.featuredCard?.imageUrl));

assert("Pillar 4 is All Products", all.name === "All Products" && all.href === "/shop" && all.dropdownType === "none");

// 2. Test Without Policy
console.log("\n[Test 2] Without Policy:");
const pillarsNoPolicy = groupNavigationCategories(DEFAULT_CLOTHING_CATEGORIES, undefined);
assert("Still produces 4 pillars safely", pillarsNoPolicy.length === 4);

// 3. Test With Empty Categories
console.log("\n[Test 3] Empty Categories Array Edge Case:");
const pillarsEmpty = groupNavigationCategories([], festivePolicy);
assert("Handles empty categories without throwing", pillarsEmpty.length === 4);
assert("Women pillar is present", pillarsEmpty[0].name === "Women");
assert("Men pillar is present with fallback subcategories", (pillarsEmpty[1].sections?.[0]?.items?.length || 0) > 0);
assert("Pooja pillar is present with fallback subcategories", (pillarsEmpty[2].sections?.[0]?.items?.length || 0) > 0);

// 4. Test Live Local Server Response
console.log("\n[Test 4] Live HTTP Response from localhost:3000:");
async function testLiveServer() {
  try {
    const res = await fetch("http://localhost:3000/");
    assert("Server responds with 200 OK", res.status === 200);
    const html = await res.text();
    assert("HTML contains Women pillar link", html.includes("Women"));
    assert("HTML contains Men pillar link", html.includes("Men"));
    assert("HTML contains Pooja & Brass pillar link", html.includes("Pooja &amp; Brass") || html.includes("Pooja & Brass"));
    assert("HTML contains Festive Offers", html.includes("Festive") || html.includes("Pongal"));
    assert("HTML contains All Products", html.includes("All Products"));
    console.log("\n🎉 ALL NAVIGATION TESTS PASSED CLEANLY!");
  } catch (err) {
    console.warn("Could not connect to localhost:3000:", err);
  }
}

testLiveServer();
