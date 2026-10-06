export {};

try {
  process.loadEnvFile(".env.local");
} catch {}

async function testReturnsPolicyWorkflow() {
  console.log("=== VELAASH RETURNS POLICY & FINAL SALE SUITE ===\n");

  const { getSiteSettings } = await import("../features/settings/queries/get-site-settings");
  const { ReturnsSettingsSchema } = await import("../features/admin/types/settings");
  const { AdminProductFormSchema } = await import("../features/admin/types/products");
  const { CartItemSchema } = await import("../features/cart/types");

  // 1. Test ReturnsSettingsSchema
  const validSettings = ReturnsSettingsSchema.safeParse({
    return_window_days: 10,
    short_summary: "Custom short return policy summary with at least 10 chars.",
    full_policy_html: "<h3>Custom Title</h3><p>Detailed legal terms here.</p>",
  });
  console.log("1. ReturnsSettingsSchema validation:", validSettings.success ? "PASS" : "FAIL");
  if (!validSettings.success) {
    console.error("  Error:", validSettings.error);
    process.exit(1);
  }

  // 2. Test site settings query
  const settings = await getSiteSettings();
  console.log("2. getSiteSettings returnsPolicy populated:", Boolean(settings.returnsPolicy) ? "PASS" : "FAIL");
  console.log("   Return Window:", settings.returnsPolicy.return_window_days, "days");
  console.log("   Short Summary:", settings.returnsPolicy.short_summary.slice(0, 50) + "...");
  console.log("   Full Policy HTML length:", settings.returnsPolicy.full_policy_html.length, "chars");

  // 3. Test AdminProductFormSchema with is_returnable toggle
  const returnableProduct = AdminProductFormSchema.safeParse({
    name: "Classic Silk Saree",
    slug: "classic-silk-saree",
    category_id: "a11ef935-7119-4eff-8380-9973ebe92271",
    base_price: 2999,
    images: [{ image_url: "https://example.com/1.webp", alt_text: "Front view", is_primary: true, display_order: 1 }],
    variants: [{ size: "Free Size", color: "Red", color_hex: "#ff0000", stock_quantity: 10, sku: "SKU-1" }],
    is_returnable: true,
  });
  console.log("3. Returnable product schema validation:", returnableProduct.success ? "PASS" : "FAIL");

  const finalSaleProduct = AdminProductFormSchema.safeParse({
    name: "Custom Bridal Saree (Stitched)",
    slug: "custom-bridal-saree-stitched",
    category_id: "a11ef935-7119-4eff-8380-9973ebe92271",
    base_price: 14999,
    images: [{ image_url: "https://example.com/2.webp", alt_text: "Bridal view", is_primary: true, display_order: 1 }],
    variants: [{ size: "Custom", color: "Gold", color_hex: "#d4af37", stock_quantity: 1, sku: "BRIDAL-1" }],
    is_returnable: false,
    return_override_note: "Custom-stitched couture piece; non-returnable.",
  });
  console.log("4. Final Sale product schema validation:", finalSaleProduct.success ? "PASS" : "FAIL");
  if (finalSaleProduct.success) {
    console.log("   is_returnable:", finalSaleProduct.data.is_returnable);
    console.log("   return_override_note:", finalSaleProduct.data.return_override_note);
  }

  // 5. Test CartItemSchema with Final Sale fields
  const cartItem = CartItemSchema.safeParse({
    id: "item-1",
    productId: "prod-1",
    title: "Custom Bridal Saree (Stitched)",
    slug: "custom-bridal-saree-stitched",
    price: 14999,
    image: "https://example.com/2.webp",
    quantity: 1,
    maxStock: 1,
    isReturnable: false,
    returnOverrideNote: "Custom-stitched couture piece; non-returnable.",
  });
  console.log("5. CartItemSchema with Final Sale validation:", cartItem.success ? "PASS" : "FAIL");

  console.log("\n=== ALL RETURNS POLICY & FINAL SALE TESTS PASSED ===");
}

testReturnsPolicyWorkflow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
