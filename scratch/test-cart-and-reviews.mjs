/**
 * In-depth functional test for Cart Zustand store & Review submission flow
 */

// Mock browser localStorage for Node test environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getRawStore: () => store,
  };
})();

globalThis.localStorage = storageMock;

async function testCartAndReviews() {
  console.log("=== TESTING CART STORE & PERSISTENCE ===");

  // Dynamically import the cart store
  const { useCartStore } = await import("../features/cart/store/cart-store.js").catch(async () => {
    // Or tsx / ts-node equivalent or compile check
    return await import("../features/cart/store/cart-store.ts");
  });

  const store = useCartStore.getState();
  store.clearCart();

  console.log("[Cart Test 1] Adding item: Chanderi Kurta (Ivory, Size S, Qty 1)...");
  store.addItem(
    {
      productId: "p1111111-1111-4111-b111-111111111111",
      variantId: "v-ivory-s",
      title: "Chanderi Embroidered Kurta Set",
      slug: "chanderi-embroidered-kurta-set",
      size: "S",
      color: "Ivory",
      price: 4250,
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
      maxStock: 5,
    },
    1
  );

  let currentItems = useCartStore.getState().items;
  console.log(`Cart items count: ${currentItems.length}`);
  console.log(`Total items quantity: ${useCartStore.getState().getTotalItems()}`);
  console.log(`Cart subtotal: ₹${useCartStore.getState().getSubtotal()}`);

  if (currentItems.length !== 1 || currentItems[0].quantity !== 1) {
    throw new Error("Failed to add initial cart item!");
  }
  console.log("✓ Initial item added correctly!");

  console.log("\n[Cart Test 2] Adding SAME variant again (Ivory, Size S, Qty 2)...");
  store.addItem(
    {
      productId: "p1111111-1111-4111-b111-111111111111",
      variantId: "v-ivory-s",
      title: "Chanderi Embroidered Kurta Set",
      slug: "chanderi-embroidered-kurta-set",
      size: "S",
      color: "Ivory",
      price: 4250,
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
      maxStock: 5,
    },
    2
  );

  currentItems = useCartStore.getState().items;
  console.log(`Cart items count (should still be 1 item row): ${currentItems.length}`);
  console.log(`Item quantity (should now be 3): ${currentItems[0].quantity}`);
  console.log(`Cart subtotal: ₹${useCartStore.getState().getSubtotal()}`);

  if (currentItems.length !== 1 || currentItems[0].quantity !== 3) {
    throw new Error("Failed to increment quantity for duplicate variant!");
  }
  console.log("✓ Duplicate variant incremented quantity without duplicating rows!");

  console.log("\n[Cart Test 3] Adding DIFFERENT variant (Sage Green, Size M)...");
  store.addItem(
    {
      productId: "p1111111-1111-4111-b111-111111111111",
      variantId: "v-sage-m",
      title: "Chanderi Embroidered Kurta Set",
      slug: "chanderi-embroidered-kurta-set",
      size: "M",
      color: "Sage Green",
      price: 4250,
      image: "https://images.unsplash.com/photo-1583391733975-47b198188151",
      maxStock: 5,
    },
    1
  );

  currentItems = useCartStore.getState().items;
  console.log(`Cart items count (should be 2): ${currentItems.length}`);
  console.log(`Total items quantity (should be 4): ${useCartStore.getState().getTotalItems()}`);

  if (currentItems.length !== 2 || useCartStore.getState().getTotalItems() !== 4) {
    throw new Error("Failed to add distinct variant as separate item!");
  }
  console.log("✓ Distinct variant added as separate item!");

  console.log("\n[Cart Test 4] Checking LocalStorage Persistence...");
  const rawStorage = storageMock.getItem("velaash_guest_cart");
  console.log("LocalStorage content for 'velaash_guest_cart':", rawStorage);
  if (!rawStorage || !rawStorage.includes("v-ivory-s") || !rawStorage.includes("v-sage-m")) {
    throw new Error("LocalStorage persistence failed!");
  }
  console.log("✓ Zustand localStorage persistence verified!");

  console.log("\n[Review Action Test] Testing submitProductReview Server Action validation...");
  const { submitProductReview } = await import("../features/reviews/actions/submit-review.ts");

  // Test with invalid rating
  const invalidRatingRes = await submitProductReview({
    productId: "p1111111-1111-4111-b111-111111111111",
    rating: 6,
    comment: "This rating is too high",
  });
  console.log("Invalid rating response:", invalidRatingRes);
  if (invalidRatingRes.success !== false) {
    throw new Error("Validation failed: allowed rating > 5");
  }

  // Test with too short comment
  const shortCommentRes = await submitProductReview({
    productId: "p1111111-1111-4111-b111-111111111111",
    rating: 5,
    comment: "hi",
  });
  console.log("Short comment response:", shortCommentRes);
  if (shortCommentRes.success !== false) {
    throw new Error("Validation failed: allowed too short comment");
  }

  console.log("✓ Server action validation checks verified!");
  console.log("\n=== ALL FUNCTIONAL TESTS COMPLETED SUCCESSFULLY! ===");
}

testCartAndReviews().catch((err) => {
  console.error("Cart / Review test error:", err);
  process.exit(1);
});
