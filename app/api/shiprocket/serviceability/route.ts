import { NextRequest, NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shiprocket";
import { checkServiceabilityRateLimit } from "@/lib/rate-limit";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateCheck = await checkServiceabilityRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many serviceability lookups. Please wait a few moments before trying again." },
      { status: 429 }
    );
  }

  const { searchParams } = req.nextUrl;
  const pincode = searchParams.get("pincode")?.trim() ?? "";
  const weightGrams = parseInt(searchParams.get("weight") ?? "500", 10);
  const declaredValue = parseFloat(searchParams.get("declared_value") ?? "999");
  const cod = searchParams.get("cod") === "1";

  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return NextResponse.json(
      { error: "Invalid pincode. Must be a valid 6-digit Indian PIN code starting with digits 1-9." },
      { status: 400 }
    );
  }

  // Pickup postcode comes from the admin-configured store address in site_settings.
  // Falls back to a Tamil Nadu default if not yet configured.
  let pickupPostcode = "600001"; // Chennai fallback
  try {
    const settings = await getSiteSettings();
    if (settings.shiprocketSettings?.pickup_postcode) {
      pickupPostcode = settings.shiprocketSettings.pickup_postcode;
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
