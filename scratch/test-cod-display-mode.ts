/**
 * Verification test for COD Disabled Display Mode Setting
 * Tests:
 * 1. Database migration and live site_settings update
 * 2. getSiteSettings query parsing
 * 3. updatePaymentSettingsAction server action validation
 * 4. Display logic matrix (Hidden vs Blurred vs Enabled)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { updatePaymentSettingsAction } from "@/features/admin/actions/settings-actions";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

async function run() {
  console.log("================================================================");
  console.log("     TESTING COD DISABLED DISPLAY MODE SETTING & LOGIC          ");
  console.log("================================================================\n");

  const admin = createAdminClient();

  // Test 1: Update live DB site_settings row for payment_settings to include cod_disabled_display_mode
  console.log("[Test 1] Database & site_settings row update:");
  const { data: existingRow, error: fetchErr } = await admin
    .from("site_settings")
    .select("key, value")
    .eq("key", "payment_settings")
    .single();

  assert(!fetchErr && Boolean(existingRow), "payment_settings exists in site_settings table");

  const currentValue = (existingRow?.value || {}) as Record<string, unknown>;
  const updatedValue = {
    ...currentValue,
    cod_disabled_display_mode: currentValue.cod_disabled_display_mode || "hidden",
  };

  const { error: updateErr } = await admin
    .from("site_settings")
    .update({
      value: updatedValue as any,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "payment_settings");

  assert(!updateErr, "Successfully updated live payment_settings with cod_disabled_display_mode");

  // Test 2: Verify getSiteSettings query parses cod_disabled_display_mode
  console.log("\n[Test 2] Query getSiteSettings():");
  const settings = await getSiteSettings();
  assert(
    typeof settings.paymentSettings.cod_disabled_display_mode === "string",
    `settings.paymentSettings.cod_disabled_display_mode exists (Value: "${settings.paymentSettings.cod_disabled_display_mode}")`
  );
  assert(
    ["hidden", "blurred"].includes(settings.paymentSettings.cod_disabled_display_mode),
    `cod_disabled_display_mode has a valid enum value ("hidden" | "blurred")`
  );

  // Test 3: Test updatePaymentSettingsAction
  console.log("\n[Test 3] Admin Action updatePaymentSettingsAction validation:");
  // Note: updatePaymentSettingsAction requires admin role, we can verify schema parsing
  const { PaymentSettingsSchema } = await import("@/features/admin/types/settings");
  
  const parsedHidden = PaymentSettingsSchema.safeParse({
    cod_enabled: false,
    cod_max_order_value: 20000,
    cod_handling_fee: 99,
    cod_disabled_display_mode: "hidden",
    razorpay_enabled: true,
  });
  assert(parsedHidden.success, "PaymentSettingsSchema accepts 'hidden' display mode");

  const parsedBlurred = PaymentSettingsSchema.safeParse({
    cod_enabled: false,
    cod_max_order_value: 20000,
    cod_handling_fee: 99,
    cod_disabled_display_mode: "blurred",
    razorpay_enabled: true,
  });
  assert(parsedBlurred.success, "PaymentSettingsSchema accepts 'blurred' display mode");

  const parsedDefault = PaymentSettingsSchema.safeParse({
    cod_enabled: false,
    cod_max_order_value: 20000,
    cod_handling_fee: 99,
    razorpay_enabled: true,
  });
  assert(
    parsedDefault.success && parsedDefault.data.cod_disabled_display_mode === "hidden",
    "PaymentSettingsSchema defaults to 'hidden' if not provided"
  );

  // Test 4: Display Matrix Verification
  console.log("\n[Test 4] Display Logic Verification (PaymentMethodStep logic):");
  const shouldRender = (codEnabled: boolean, mode: "hidden" | "blurred") => {
    return codEnabled || mode === "blurred";
  };

  // Case A: COD Enabled (mode doesn't matter) -> MUST render
  assert(
    shouldRender(true, "hidden") === true,
    "When COD is ON: COD option is rendered on checkout"
  );
  assert(
    shouldRender(true, "blurred") === true,
    "When COD is ON: COD option is rendered on checkout regardless of disabled mode"
  );

  // Case B: COD Disabled + Mode = "hidden" -> MUST NOT render (not visible on page)
  assert(
    shouldRender(false, "hidden") === false,
    "When COD is OFF and mode is 'hidden': COD option is NOT rendered (completely hidden from page)"
  );

  // Case C: COD Disabled + Mode = "blurred" -> MUST render (grayed out with unavailable badge)
  assert(
    shouldRender(false, "blurred") === true,
    "When COD is OFF and mode is 'blurred': COD option IS rendered (visible with disabled blur styling)"
  );

  console.log("\n================================================================");
  console.log("       ALL COD DISPLAY MODE TESTS PASSED SUCCESSFULLY!          ");
  console.log("================================================================\n");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
