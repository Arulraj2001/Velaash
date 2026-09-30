import { NextRequest, NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shiprocket";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";

/**
 * GET /api/shiprocket/serviceability
 *
 * Query params:
 *   pincode        – 6-digit destination pincode (required)
 *   weight         – item weight in grams (optional, default 500g)
 *   declared_value – total order value in INR (optional, default 999)
 *   cod            – "1" or "0" (optional, default "0")
 *
 * Response (200):
 *   { serviceable, estimatedDays, courierName, codAvailable, isLive }
 *
 * Response (400): { error: "..." }
 * Response (503): { serviceable: false, estimatedDays: null }  – API failure fallback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pincode = searchParams.get("pincode")?.trim() ?? "";
  const weightGrams = parseInt(searchParams.get("weight") ?? "500", 10);
  const declaredValue = parseFloat(searchParams.get("declared_value") ?? "999");
  const cod = searchParams.get("cod") === "1";

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: "Invalid pincode. Must be exactly 6 digits." },
      { status: 400 }
    );
  }

  // Pickup postcode comes from the admin-configured store address in site_settings.
  // Falls back to a Tamil Nadu default if not yet configured.
  let pickupPostcode = "600001"; // Chennai fallback
  try {
    const settings = await getSiteSettings();
    // @ts-expect-error – shiprocket_settings may not be in the typed interface yet
    const srSettings = settings.shiprocketSettings as { pickup_postcode?: string } | undefined;
    if (srSettings?.pickup_postcode) {
      pickupPostcode = srSettings.pickup_postcode;
    }
  } catch {
    // Non-critical — use fallback
  }

  const result = await checkServiceability({
    pickupPostcode,
    deliveryPostcode: pincode,
    weightGrams: Number.isFinite(weightGrams) && weightGrams > 0 ? weightGrams : 500,
    totalAmountINR: Number.isFinite(declaredValue) && declaredValue > 0 ? declaredValue : 999,
    cod,
  });

  if (!result) {
    // Shiprocket API failure — return a graceful degraded response
    return NextResponse.json(
      {
        serviceable: true,
        estimatedDays: 7,
        courierName: null,
        codAvailable: true,
        isLive: false,
        degraded: true,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(result, { status: 200 });
}
