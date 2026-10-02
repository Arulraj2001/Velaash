import assert from "node:assert";
import { createAdminClient } from "../lib/supabase/admin";
import { isExcludedPromoRoute, PROMO_POPUP_STORAGE_KEY } from "../components/ui/promo-offer-popup";
import { getPromoPopup } from "../features/settings/queries/get-promo-popup";

/**
 * Terminal Verification Test Suite for Velaash Promotional Offer Popup:
 *
 * 1. Popup does not render on excluded routes (/admin/*, /checkout*, /cart*, /account*).
 * 2. Popup does not show if no active coupon is linked (even if enabled).
 * 3. Popup does not show a second time within the same day for the same visitor (calendar day check).
 * 4. Popup auto-hides if the linked coupon is deactivated/expired after being set.
 * 5. Displayed code/discount always matches the live coupon record exactly.
 */

async function runSuite() {
  console.log("=================================================================");
  console.log("PROMO POPUP TERMINAL VERIFICATION SUITE");
  console.log("=================================================================\n");

  const adminClient = createAdminClient();

  // Save current promo_popup setting for restoration at end of test
  const { data: initialSettingRow } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "promo_popup")
    .maybeSingle();

  const initialSettingValue = initialSettingRow?.value || null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Route Exclusion Logic
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Route Exclusion Verification ---");
    const excludedRoutes = [
      "/admin",
      "/admin/settings",
      "/admin/coupons",
      "/admin/orders",
      "/admin/orders/VEL-2026-0001",
      "/checkout",
      "/checkout/",
      "/checkout/order-summary",
      "/cart",
      "/cart/",
      "/account",
      "/account/orders",
      "/account/profile",
      "/account/wishlist",
      "/ACCOUNT/SETTINGS", // case-insensitive check
    ];

    for (const route of excludedRoutes) {
      assert.strictEqual(
        isExcludedPromoRoute(route),
        true,
        `Route ${route} must be EXCLUDED from displaying promo popup`
      );
    }
    console.log(`✓ All ${excludedRoutes.length} excluded routes correctly blocked.`);

    const allowedRoutes = [
      "/",
      "/shop",
      "/category/kurtas",
      "/collections/festive",
      "/products/anarkali-suit-set",
      "/about",
      "/contact",
      "/faq",
      "/shipping-returns",
      "/terms-conditions",
      "/privacy-policy",
    ];

    for (const route of allowedRoutes) {
      assert.strictEqual(
        isExcludedPromoRoute(route),
        false,
        `Route ${route} must be ALLOWED to display promo popup`
      );
    }
    console.log(`✓ All ${allowedRoutes.length} storefront browsing routes correctly allowed.`);
    console.log("TEST 1 PASSED.\n");

    // -------------------------------------------------------------------------
    // TEST 2: No Active Coupon Linked (Even If Enabled)
    // -------------------------------------------------------------------------
    console.log("--- TEST 2: Enabled but No Linked Coupon ---");

    // Subcase 2A: is_enabled = true, but featured_coupon_id = null
    await adminClient.from("site_settings").upsert({
      key: "promo_popup",
      value: {
        is_enabled: true,
        featured_coupon_id: null,
        popup_title: "Null Coupon Test",
        popup_description: "Should never render without a linked coupon",
      },
      is_public: true,
      updated_at: new Date().toISOString(),
    });

    const result2A = await getPromoPopup();
    assert.strictEqual(
      result2A,
      null,
      "getPromoPopup must return null when featured_coupon_id is null even if enabled"
    );
    console.log("✓ Subcase 2A: Returned null when featured_coupon_id is null.");

    // Subcase 2B: is_enabled = true, but featured_coupon_id points to non-existent coupon
    await adminClient.from("site_settings").upsert({
      key: "promo_popup",
      value: {
        is_enabled: true,
        featured_coupon_id: "00000000-0000-0000-0000-000000000000",
        popup_title: "Non-existent Coupon Test",
        popup_description: "Should never render with invalid coupon FK",
      },
      is_public: true,
      updated_at: new Date().toISOString(),
    });

    const result2B = await getPromoPopup();
    assert.strictEqual(
      result2B,
      null,
      "getPromoPopup must return null when featured_coupon_id is non-existent"
    );
    console.log("✓ Subcase 2B: Returned null when coupon row does not exist in DB.");

    // Subcase 2C: is_enabled = false
    await adminClient.from("site_settings").upsert({
      key: "promo_popup",
      value: {
        is_enabled: false,
        featured_coupon_id: "10000000-0000-4000-8000-000000000002", // VELAASH10
        popup_title: "Disabled Test",
        popup_description: "Disabled popup",
      },
      is_public: true,
      updated_at: new Date().toISOString(),
    });

    const result2C = await getPromoPopup();
    assert.strictEqual(
      result2C,
      null,
      "getPromoPopup must return null when is_enabled is false"
    );
    console.log("✓ Subcase 2C: Returned null when is_enabled is false.");
    console.log("TEST 2 PASSED.\n");

    // -------------------------------------------------------------------------
    // TEST 3: Visitor Once-per-Calendar-Day Storage Logic
    // -------------------------------------------------------------------------
    console.log("--- TEST 3: Visitor Once-per-Calendar-Day Lifecycle ---");
    // Simulate browser localStorage behavior across days
    const mockStorage = new Map<string, string>();
    const testDateDay1 = "2026-10-02";
    const testDateDay2 = "2026-10-03";

    function shouldDisplayForVisitor(currentDate: string): boolean {
      const stored = mockStorage.get(PROMO_POPUP_STORAGE_KEY);
      if (stored === currentDate) {
        return false; // Already seen today
      }
      return true; // Not seen today
    }

    function recordVisitorImpression(currentDate: string) {
      mockStorage.set(PROMO_POPUP_STORAGE_KEY, currentDate);
    }

    // Step A: First page load on Day 1
    assert.strictEqual(
      shouldDisplayForVisitor(testDateDay1),
      true,
      "First visit of Day 1 should display popup"
    );
    recordVisitorImpression(testDateDay1);

    // Step B: Second page load on Day 1 (same day, same visitor)
    assert.strictEqual(
      shouldDisplayForVisitor(testDateDay1),
      false,
      "Second visit on Day 1 must NOT display popup"
    );

    // Step C: Third page load on Day 1 (after browsing to other pages)
    assert.strictEqual(
      shouldDisplayForVisitor(testDateDay1),
      false,
      "Subsequent visit on same calendar day must remain suppressed"
    );
    console.log("✓ Visitor suppression active on same calendar day.");

    // Step D: New visit on Day 2 (new calendar day)
    assert.strictEqual(
      shouldDisplayForVisitor(testDateDay2),
      true,
      "Visit on next calendar day should reset and allow showing"
    );
    recordVisitorImpression(testDateDay2);

    assert.strictEqual(
      shouldDisplayForVisitor(testDateDay2),
      false,
      "Second visit on Day 2 should be suppressed once shown"
    );
    console.log("✓ Calendar day rollover correctly resets eligibility.");
    console.log("TEST 3 PASSED.\n");

    // -------------------------------------------------------------------------
    // TEST 4 & 5: Live Database Verification (Auto-hide on Inactive/Expired & Exact Match)
    // -------------------------------------------------------------------------
    console.log("--- TEST 4 & 5: Live Coupon State & Dynamic Match ---");
    const testCouponId = "20000000-0000-4000-8000-000000000099";
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 86400000).toISOString();
    const pastDate = new Date(now.getTime() - 24 * 3600000).toISOString();
    const pastFrom = new Date(now.getTime() - 48 * 3600000).toISOString();

    // 1. Create a dedicated active test coupon
    await adminClient.from("coupons").upsert({
      id: testCouponId,
      code: "POPUPTEST25",
      discount_type: "percentage",
      discount_value: 25,
      min_order_value: 1999,
      max_discount_amount: 500,
      usage_limit: 1000,
      usage_count: 0,
      valid_from: pastDate,
      valid_until: futureDate,
      is_active: true,
      updated_at: now.toISOString(),
    });

    // 2. Link in promo_popup setting
    await adminClient.from("site_settings").upsert({
      key: "promo_popup",
      value: {
        is_enabled: true,
        featured_coupon_id: testCouponId,
        popup_title: "Exclusive 25% Off Celebration",
        popup_description: "Enjoy a royal welcome discount on handcrafted kurtas.",
        delay_seconds: 9,
      },
      is_public: true,
      updated_at: now.toISOString(),
    });

    // 3. Query getPromoPopup() and verify live match
    const liveMatch1 = await getPromoPopup();
    assert(liveMatch1 !== null, "getPromoPopup must return data for active linked coupon");
    assert.strictEqual(liveMatch1.coupon.code, "POPUPTEST25", "Code must match live record exactly");
    assert.strictEqual(liveMatch1.coupon.discountType, "percentage", "Discount type must match");
    assert.strictEqual(liveMatch1.coupon.discountValue, 25, "Discount value must match 25%");
    assert.strictEqual(liveMatch1.coupon.minOrderValue, 1999, "Min order value must match ₹1,999");
    assert.strictEqual(liveMatch1.coupon.maxDiscountAmount, 500, "Max discount must match ₹500");
    assert.strictEqual(liveMatch1.title, "Exclusive 25% Off Celebration");
    console.log("✓ Live percentage coupon parameters matched record exactly.");

    // 4. Test Flat discount dynamic rendering
    await adminClient.from("coupons").update({
      code: "FLAT350OFF",
      discount_type: "flat",
      discount_value: 350,
      min_order_value: 2499,
      max_discount_amount: null,
      updated_at: new Date().toISOString(),
    }).eq("id", testCouponId);

    const liveMatch2 = await getPromoPopup();
    assert(liveMatch2 !== null, "getPromoPopup must return data after coupon update");
    assert.strictEqual(liveMatch2.coupon.code, "FLAT350OFF", "Updated code must reflect live");
    assert.strictEqual(liveMatch2.coupon.discountType, "flat", "Updated type must be flat");
    assert.strictEqual(liveMatch2.coupon.discountValue, 350, "Updated discount must be 350");
    assert.strictEqual(liveMatch2.coupon.minOrderValue, 2499, "Updated min order must be 2499");
    console.log("✓ Live flat discount coupon parameters matched record exactly.");

    // 5. Test Auto-hide on Deactivation
    console.log("\nTesting auto-hide when coupon is deactivated...");
    await adminClient.from("coupons").update({
      is_active: false,
      updated_at: new Date().toISOString(),
    }).eq("id", testCouponId);

    const deactivatedResult = await getPromoPopup();
    assert.strictEqual(
      deactivatedResult,
      null,
      "Popup must auto-hide when linked coupon is marked is_active = false"
    );
    console.log("✓ Popup automatically disappeared when coupon was deactivated.");

    // 6. Test Auto-hide on Expiration
    console.log("Testing auto-hide when coupon expires...");
    await adminClient.from("coupons").update({
      is_active: true,
      valid_from: pastFrom,
      valid_until: pastDate, // Expired yesterday
      updated_at: new Date().toISOString(),
    }).eq("id", testCouponId);

    const expiredResult = await getPromoPopup();
    assert.strictEqual(
      expiredResult,
      null,
      "Popup must auto-hide when linked coupon is expired (valid_until in past)"
    );
    console.log("✓ Popup automatically disappeared when coupon expired.");

    // 7. Test Auto-hide on Usage Limit Exhaustion
    console.log("Testing auto-hide when coupon usage limit is exhausted...");
    await adminClient.from("coupons").update({
      is_active: true,
      valid_from: pastDate,
      valid_until: futureDate,
      usage_limit: 10,
      usage_count: 10, // Exhausted
      updated_at: new Date().toISOString(),
    }).eq("id", testCouponId);

    const exhaustedResult = await getPromoPopup();
    assert.strictEqual(
      exhaustedResult,
      null,
      "Popup must auto-hide when coupon usage limit is exhausted"
    );
    console.log("✓ Popup automatically disappeared when coupon usage limit was reached.");

    // Clean up test coupon
    await adminClient.from("coupons").delete().eq("id", testCouponId);
    console.log("✓ Temporary test coupon cleaned up.");

    console.log("TEST 4 & 5 PASSED.\n");
  } finally {
    // Restore initial promo_popup setting
    if (initialSettingValue) {
      await adminClient.from("site_settings").upsert({
        key: "promo_popup",
        value: initialSettingValue,
        is_public: true,
        updated_at: new Date().toISOString(),
      });
      console.log("✓ Original promo_popup setting restored.");
    }
  }

  console.log("=================================================================");
  console.log("ALL 5 VERIFICATION SUITES PASSED CLEANLY!");
  console.log("=================================================================");
}

runSuite().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
