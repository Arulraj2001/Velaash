import { calculateCartTotals, calculateCouponDiscount } from "../features/cart/utils/pricing";
import type { CartItem, ShippingPolicyData, AppliedCoupon } from "../features/cart/types";
import { getProductFestiveShippingBadge } from "../features/products/types";

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log("   VERIFYING FESTIVE FREE SHIPPING (PRODUCT & COUPON) SCENARIOS   ");
  console.log("==================================================================\n");

  const baseShippingPolicy: ShippingPolicyData = {
    free_shipping_threshold: 999,
    standard_shipping_fee: 100,
    festive_shipping_enabled: true,
    festive_campaign_name: "Pongal Festival Special",
    festive_badge_text: "🌾 Pongal Special: Free Delivery",
    festive_valid_from: "2026-01-01T00:00:00.000Z",
    festive_valid_until: "2030-01-01T00:00:00.000Z",
    festive_product_ids: ["pongal-brass-lamp", "festive-silk-saree"],
    festive_category_ids: [],
    festive_coupon_code: "PONGALFREE",
    festive_apply_to_all: false,
  };

  const normalItem: CartItem = {
    id: "item-1",
    productId: "regular-kurta",
    title: "Cotton Straight Kurta",
    slug: "regular-kurta",
    price: 499,
    quantity: 1,
    image: "/placeholder.jpg",
    maxStock: 10,
    isAvailable: true,
  };

  const festiveItem: CartItem = {
    id: "item-2",
    productId: "pongal-brass-lamp",
    title: "Handcrafted Brass Diya Lamp",
    slug: "pongal-brass-lamp",
    price: 650,
    quantity: 1,
    image: "/placeholder.jpg",
    maxStock: 10,
    isAvailable: true,
  };

  // ─── TEST 1: Normal cart (< ₹999) without festive items ─────────
  console.log("Test Suite 1: Normal cart (< ₹999)");
  {
    const res = calculateCartTotals({
      items: [normalItem],
      shippingPolicy: baseShippingPolicy,
    });
    assert(res.subtotal === 499, "Subtotal is ₹499");
    assert(res.shippingFee === 100, "Standard shipping fee of ₹100 applied");
    assert(res.isFreeShipping === false, "isFreeShipping is false");
    assert(res.total === 599, "Total is ₹499 + ₹100 = ₹599");
    assert(res.amountNeededForFreeShipping === 500, "₹500 more needed for threshold");
  }

  // ─── TEST 2: Threshold Free Shipping (>= ₹999) ──────────────────
  console.log("\nTest Suite 2: Storewide Threshold Free Shipping (>= ₹999)");
  {
    const res = calculateCartTotals({
      items: [{ ...normalItem, quantity: 2, price: 500 }],
      shippingPolicy: baseShippingPolicy,
    });
    assert(res.subtotal === 1000, "Subtotal is ₹1,000");
    assert(res.shippingFee === 0, "Shipping fee is ₹0");
    assert(res.isFreeShipping === true, "isFreeShipping is true");
    assert(res.freeShippingReason === "threshold", "Reason is threshold");
    assert(res.total === 1000, "Total is ₹1,000");
  }

  // ─── TEST 3: Festive Product in Cart (< ₹999) ───────────────────
  console.log("\nTest Suite 3: Festive Product Automatic Free Shipping (< ₹999)");
  {
    const res = calculateCartTotals({
      items: [festiveItem],
      shippingPolicy: baseShippingPolicy,
    });
    assert(res.subtotal === 650, "Subtotal is ₹650 (< ₹999 threshold)");
    assert(res.shippingFee === 0, "Shipping fee waived to ₹0 automatically");
    assert(res.isFreeShipping === true, "isFreeShipping is true");
    assert(res.freeShippingReason === "product_offer", "Reason is product_offer");
    assert(res.freeShippingBadgeText === "🌾 Pongal Special: Free Delivery", "Badge text matches");
    assert(res.total === 650, "Total is ₹650");
    assert(res.freeShippingProgress === 100, "Progress bar is 100%");
  }

  // ─── TEST 4: Festive Coupon Code (PONGALFREE) on Normal Item ────
  console.log("\nTest Suite 4: Festive Coupon Code (PONGALFREE)");
  {
    const coupon: AppliedCoupon = {
      code: "PONGALFREE",
      discountType: "free_shipping",
      discountValue: 100,
      minOrderValue: 0,
      discountAmount: 0,
    };
    const res = calculateCartTotals({
      items: [normalItem],
      appliedCoupon: coupon,
      shippingPolicy: baseShippingPolicy,
    });
    assert(res.subtotal === 499, "Subtotal is ₹499");
    assert(res.shippingFee === 0, "Shipping fee waived to ₹0 by coupon");
    assert(res.isFreeShipping === true, "isFreeShipping is true");
    assert(res.freeShippingReason === "coupon", "Reason is coupon");
    assert(res.total === 499, "Total is ₹499 (0 shipping)");
  }

  // ─── TEST 5: Festive Product + Percentage Coupon (No Conflict) ───
  console.log("\nTest Suite 5: Festive Product + 10% Discount Coupon (Stacked)");
  {
    const coupon: AppliedCoupon = {
      code: "VELAASH10",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 0,
      discountAmount: 65,
    };
    const res = calculateCartTotals({
      items: [festiveItem], // ₹650
      appliedCoupon: coupon,
      shippingPolicy: baseShippingPolicy,
    });
    assert(res.subtotal === 650, "Subtotal is ₹650");
    assert(res.discount === 65, "10% coupon gives ₹65 discount");
    assert(res.shippingFee === 0, "Festive item keeps shipping at ₹0");
    assert(res.total === 585, "Total is ₹650 - ₹65 + ₹0 = ₹585 (No conflict)");
  }

  // ─── TEST 6: Expired Campaign Reverts to Standard Delivery ───────
  console.log("\nTest Suite 6: Expired Campaign Expiration Logic");
  {
    const expiredPolicy: ShippingPolicyData = {
      ...baseShippingPolicy,
      festive_valid_until: "2020-01-01T00:00:00.000Z", // Past date
    };
    const res = calculateCartTotals({
      items: [festiveItem],
      shippingPolicy: expiredPolicy,
    });
    assert(res.shippingFee === 100, "Expired campaign automatically restores ₹100 shipping fee");
    assert(res.isFreeShipping === false, "isFreeShipping is false once expired");
    assert(res.total === 750, "Total is ₹650 + ₹100 = ₹750");
  }

  // ─── TEST 7: Product Card Badge Helper ──────────────────────────
  console.log("\nTest Suite 7: getProductFestiveShippingBadge Helper");
  {
    const activeBadge = getProductFestiveShippingBadge(
      { id: "pongal-brass-lamp", slug: "pongal-brass-lamp" },
      baseShippingPolicy
    );
    assert(activeBadge === "🌾 Pongal Special: Free Delivery", "Eligible product returns festive badge");

    const regularBadge = getProductFestiveShippingBadge(
      { id: "regular-kurta", slug: "regular-kurta" },
      baseShippingPolicy
    );
    assert(regularBadge === null, "Regular product returns null badge");
  }

  console.log("\n==================================================================");
  console.log("          ALL 7 TEST SUITES PASSED CLEANLY (ZERO CONFLICTS)        ");
  console.log("==================================================================");
}

runTests().catch(console.error);
