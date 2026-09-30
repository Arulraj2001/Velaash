/**
 * Comprehensive Audit Test for Admin Site Settings
 * Tests all 9 setting sections:
 *  1. Store Profile
 *  2. Social Links
 *  3. Shipping Rates
 *  4. Logistics & Shiprocket
 *  5. Returns Policy
 *  6. Payments & COD
 *  7. Tax & GST
 *  8. Announcement Bar
 *  9. SEO Defaults
 */

import {
  StoreProfileSchema,
  SocialLinksSchema,
  ShippingSettingsSchema,
  ReturnsSettingsSchema,
  PaymentSettingsSchema,
  TaxSettingsSchema,
  AnnouncementSettingsSchema,
  SeoDefaultsSchema,
  ShiprocketSettingsSchema,
} from "../features/admin/types/settings";
import { getSiteSettings } from "../features/settings/queries/get-site-settings";
import { generateInvoicePdfBuffer } from "../features/admin/services/invoice-pdf";

async function runAuditTests() {
  console.log("=== VELAASH ADMIN SITE SETTINGS AUDIT TEST ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      if (detail) console.log(`     ↳ ${detail}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      if (detail) console.error(`     ↳ ${detail}`);
      failed++;
    }
  }

  // 1. Zod Schema Validations
  console.log("\n--- TEST 1: Zod Schemas for All 9 Settings Sections ---");

  // 1.1 Store Profile
  const validStore = StoreProfileSchema.safeParse({
    name: "Velaash",
    legal_name: "VELAASH TRADER'S",
    tagline: "Contemporary Elegance",
    email: "care@velaash.in",
    phone: "+91 8508643832",
    whatsapp_number: "+91 8508643832",
    whatsapp_url: "https://wa.me/918508643832",
    logo_url: "/logo.png",
    favicon_url: "/favicon.ico",
  });
  assert(validStore.success, "StoreProfileSchema accepts valid store profile");

  // 1.2 Social Links
  const validSocial = SocialLinksSchema.safeParse({
    instagram: "https://instagram.com/velaash",
    facebook: "https://facebook.com/velaash",
    whatsapp: "https://wa.me/918508643832",
    pinterest: "https://pinterest.com/velaash",
  });
  assert(validSocial.success, "SocialLinksSchema accepts valid social links with Pinterest");

  // 1.3 Shipping Settings
  const validShipping = ShippingSettingsSchema.safeParse({
    free_shipping_threshold: 999,
    standard_shipping_fee: 100,
  });
  assert(validShipping.success, "ShippingSettingsSchema accepts positive threshold and fees");

  // 1.4 Returns Policy
  const validReturns = ReturnsSettingsSchema.safeParse({
    return_window_days: 7,
    policy_description: "We accept returns within 7 calendar days of receipt.",
  });
  assert(validReturns.success, "ReturnsSettingsSchema accepts return window and description");

  // 1.5 Payment Settings
  const validPayment = PaymentSettingsSchema.safeParse({
    cod_enabled: true,
    cod_max_order_value: 20000,
    cod_handling_fee: 99,
    razorpay_enabled: true,
  });
  assert(validPayment.success, "PaymentSettingsSchema accepts COD and Razorpay configuration");

  // 1.6 Tax & GST
  const validGst = TaxSettingsSchema.safeParse({
    gst_enabled: true,
    gstin: "33ABCDE1234F1Z5",
  });
  assert(validGst.success, "TaxSettingsSchema accepts valid 15-char Indian GSTIN");

  const invalidGst = TaxSettingsSchema.safeParse({
    gst_enabled: true,
    gstin: "INVALID123",
  });
  assert(!invalidGst.success, "TaxSettingsSchema rejects malformed GSTIN format");

  // 1.7 Announcement Bar
  const validAnnouncement = AnnouncementSettingsSchema.safeParse({
    is_enabled: true,
    text: "Welcome to Velaash",
    link: "/shop",
  });
  assert(validAnnouncement.success, "AnnouncementSettingsSchema accepts valid banner");

  // 1.8 SEO Defaults
  const validSeo = SeoDefaultsSchema.safeParse({
    meta_title: "Velaash | Everyday Elegance",
    meta_description: "Modern luxury clothing handcrafted in India with refined silhouettes.",
  });
  assert(validSeo.success, "SeoDefaultsSchema accepts valid meta tags");

  // 1.9 Logistics & Shiprocket Settings
  const validShiprocket = ShiprocketSettingsSchema.safeParse({
    pickup_postcode: "600001",
    pickup_location_name: "Primary",
    default_weight_kg: 0.5,
    auto_push_on_pack: false,
  });
  assert(validShiprocket.success, "ShiprocketSettingsSchema accepts valid warehouse pickup details");

  const invalidShiprocket = ShiprocketSettingsSchema.safeParse({
    pickup_postcode: "123", // invalid length
    pickup_location_name: "",
    default_weight_kg: -1,
  });
  assert(!invalidShiprocket.success, "ShiprocketSettingsSchema rejects invalid pincode and negative weight");

  // 2. Single Source of Truth Query Verification
  console.log("\n--- TEST 2: getSiteSettings() Single Source of Truth Query ---");
  const settings = await getSiteSettings();
  assert(Boolean(settings.storeProfile?.name), "settings.storeProfile is populated", settings.storeProfile.name);
  assert(Boolean(settings.socialLinks), "settings.socialLinks is populated");
  assert(typeof settings.shippingPolicy?.free_shipping_threshold === "number", "settings.shippingPolicy is populated");
  assert(typeof settings.returnsPolicy?.return_window_days === "number", "settings.returnsPolicy is populated");
  assert(typeof settings.paymentSettings?.cod_enabled === "boolean", "settings.paymentSettings is populated");
  assert(typeof settings.taxSettings?.gst_enabled === "boolean", "settings.taxSettings is populated");
  assert(Boolean(settings.announcement?.text), "settings.announcement is populated");
  assert(Boolean(settings.seoDefaults?.meta_title), "settings.seoDefaults is populated");
  assert(Boolean(settings.shiprocketSettings?.pickup_postcode), "settings.shiprocketSettings is populated", `Pincode: ${settings.shiprocketSettings.pickup_postcode}`);

  // 3. Invoice PDF Generation with Dynamic Store Profile
  console.log("\n--- TEST 3: Invoice PDF Generation with Dynamic Store Profile ---");
  const mockOrder = {
    id: "ord-test-audit-001",
    orderNumber: "VEL-TEST-AUDIT",
    createdAt: new Date().toISOString(),
    customerEmail: "customer@example.com",
    customerPhone: "+91 9876543210",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "razorpay",
    subtotal: 3500,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 3500,
    shippingAddress: {
      fullName: "Ananya Sharma",
      addressLine1: "123 Anna Salai",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600002",
    },
    items: [
      {
        id: "item-1",
        productName: "Chanderi Silk Anarkali Set",
        variantSku: "ANR-CHND-M",
        variantSize: "M",
        quantity: 1,
        unitPrice: 3500,
        lineTotal: 3500,
      },
    ],
  };

  const dynamicStoreProfile = {
    name: "Velaash Exclusive",
    legal_name: "VELAASH TRADER'S PRIVATE LIMITED",
    email: "billing@velaash.in",
    phone: "+91 9999988888",
  };

  const pdfBuffer = await generateInvoicePdfBuffer(
    mockOrder as any,
    true,
    "33ABCDE1234F1Z5",
    dynamicStoreProfile
  );

  assert(
    Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 1000,
    "generateInvoicePdfBuffer produces valid PDF with dynamic storeProfile",
    `Size: ${pdfBuffer.length} bytes`
  );

  console.log(`\n========================================`);
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error("Audit test crashed:", err);
  process.exit(1);
});
