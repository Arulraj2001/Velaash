/**
 * ==============================================================================
 * Shiprocket Logistics Integration
 * Server-Side Only — Never import from client components
 * ==============================================================================
 *
 * Auth: Shiprocket uses email/password → JWT token (valid ~10 days).
 * Tokens are cached in-memory and refreshed when within 1 hour of expiry.
 * A null/missing credential is handled gracefully (falls back to site settings).
 *
 * ARCHITECTURE NOTES:
 * - All calls go through `shiprocketFetch` which injects the auth token
 * - Mock mode is active when SHIPROCKET_EMAIL is not configured
 * - Serviceability failures are NON-BLOCKING (returns null → fallback to site default)
 * ==============================================================================
 */

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// ---------------------------------------------------------------------------
// Token Cache (in-memory, server-singleton)
// ---------------------------------------------------------------------------
interface TokenCacheEntry {
  token: string;
  /** UNIX milliseconds when this cached entry expires */
  expiresAt: number;
}

/** Global singleton – survives across requests in the same Node process */
let _tokenCache: TokenCacheEntry | null = null;

/** 10 days in ms (Shiprocket token lifetime) */
const TOKEN_TTL_MS = 10 * 24 * 60 * 60 * 1000;
/** Refresh 1 hour before expiry so we never serve a stale token */
const TOKEN_REFRESH_BUFFER_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export interface ServiceabilityResult {
  serviceable: boolean;
  estimatedDays: number | null;
  courierName: string | null;
  /** INR rate Shiprocket quoted (before any subsidy or free-shipping overrides) */
  rate: number | null;
  codAvailable: boolean;
  /** true = result came from live Shiprocket API; false = mocked / fallback */
  isLive: boolean;
  error?: string;
}

export interface ShiprocketOrderPayload {
  orderNumber: string;
  orderDate: string; // ISO string
  channel_id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    phone: string;
  };
  /** Name of the pickup location configured in your Shiprocket dashboard */
  pickupLocation: string;
  paymentMethod: "Prepaid" | "COD";
  totalAmount: number;
  items: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
  }>;
  /** Total order weight in kg */
  weightKg: number;
  /** Parcel dimensions in cm (defaults applied if absent) */
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

export interface ShiprocketOrderResult {
  shiprocketOrderId: number | string;
  shipmentId: number | string;
  status: string;
  awbCode?: string | null;
  courierName?: string | null;
}

export interface ShiprocketTrackingResult {
  awbCode: string;
  currentStatus: string;
  estimatedDeliveryDate: string | null;
  activities: Array<{
    date: string;
    activity: string;
    location: string;
  }>;
}

// ---------------------------------------------------------------------------
// Internal helpers & Configuration Guard
// ---------------------------------------------------------------------------

/**
 * Checks whether active Shiprocket credentials are configured.
 * Mirrors the pattern in lib/razorpay.ts by detecting missing or placeholder credentials.
 */
export function isShiprocketConfigured(): boolean {
  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();
  return Boolean(
    email &&
      password &&
      !email.includes("placeholder") &&
      !password.includes("placeholder")
  );
}

function isConfigured(): boolean {
  return isShiprocketConfigured();
}

/**
 * Returns a valid JWT token, refreshing via email/password auth if needed.
 * Throws on auth failure so callers can handle gracefully.
 */
async function getToken(): Promise<string> {
  const now = Date.now();

  if (_tokenCache && _tokenCache.expiresAt - now > TOKEN_REFRESH_BUFFER_MS) {
    return _tokenCache.token;
  }

  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are not configured.");
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shiprocket auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    throw new Error("Shiprocket auth response missing token.");
  }

  _tokenCache = { token: data.token, expiresAt: now + TOKEN_TTL_MS };
  console.info("[Shiprocket] Token refreshed successfully.");
  return _tokenCache.token;
}

/**
 * Authenticated wrapper around fetch targeting the Shiprocket API.
 */
async function shiprocketFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  return fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });
}

// ---------------------------------------------------------------------------
// Serviceability Check
// ---------------------------------------------------------------------------

export interface ServiceabilityParams {
  pickupPostcode: string;
  deliveryPostcode: string;
  /** Weight in grams */
  weightGrams: number;
  totalAmountINR: number;
  cod?: boolean;
}

/**
 * Checks whether a delivery pincode is serviceable by Shiprocket couriers.
 *
 * Returns `null` on non-critical failures (API down, network error, etc.)
 * so the caller can fall back to site-default shipping rules without
 * blocking the user experience.
 */
export async function checkServiceability(
  params: ServiceabilityParams
): Promise<ServiceabilityResult | null> {
  if (!isConfigured()) {
    // No credentials configured — return a plausible mock for local development
    return {
      serviceable: true,
      estimatedDays: 5,
      courierName: null,
      rate: null,
      codAvailable: true,
      isLive: false,
    };
  }

  try {
    const qp = new URLSearchParams({
      pickup_postcode: params.pickupPostcode,
      delivery_postcode: params.deliveryPostcode,
      weight: String(Math.max(0.1, params.weightGrams / 1000)), // kg, min 0.1
      declared_value: String(params.totalAmountINR),
      cod: params.cod ? "1" : "0",
    });

    const res = await shiprocketFetch(
      `/courier/serviceability/?${qp.toString()}`
    );

    if (!res.ok) {
      console.warn(`[Shiprocket] Serviceability check HTTP ${res.status}.`);
      return null;
    }

    const body = (await res.json()) as {
      status?: number;
      data?: {
        available_courier_companies?: Array<{
          courier_name: string;
          estimated_delivery_days: number;
          rate: number;
          cod: number;
        }>;
      };
    };

    const companies = body?.data?.available_courier_companies;

    if (!companies || companies.length === 0) {
      return {
        serviceable: false,
        estimatedDays: null,
        courierName: null,
        rate: null,
        codAvailable: false,
        isLive: true,
      };
    }

    // Shiprocket returns couriers sorted by recommendation; pick the first
    const best = companies[0];

    return {
      serviceable: true,
      estimatedDays: best.estimated_delivery_days ?? null,
      courierName: best.courier_name ?? null,
      rate: best.rate ?? null,
      codAvailable: best.cod === 1,
      isLive: true,
    };
  } catch (err) {
    console.error("[Shiprocket] Serviceability check exception:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Create Shiprocket Order
// ---------------------------------------------------------------------------

/**
 * Pushes a confirmed Velaash order to Shiprocket for dispatch.
 * Called from the admin "Push to Shiprocket" action — not during checkout.
 *
 * Throws on failure so the admin server action can surface the error cleanly.
 */
export async function createShiprocketOrder(
  payload: ShiprocketOrderPayload
): Promise<ShiprocketOrderResult> {
  if (!isConfigured()) {
    // In local test/mock mode without active Shiprocket credentials (matching lib/razorpay.ts),
    // return a structured mock order so offline development & test suites function seamlessly.
    const sanitizedOrder = payload.orderNumber.replace(/[^a-zA-Z0-9]/g, "");
    return {
      shiprocketOrderId: `sr_mock_${sanitizedOrder}_${Date.now().toString().slice(-6)}`,
      shipmentId: `shp_mock_${sanitizedOrder}_${Date.now().toString().slice(-6)}`,
      status: "NEW",
      awbCode: `SRMOCK${sanitizedOrder}`,
      courierName: "Blue Dart Express (Simulated)",
    };
  }

  const addr = payload.shippingAddress;

  const requestBody = {
    order_id: payload.orderNumber,
    order_date: payload.orderDate.slice(0, 10), // YYYY-MM-DD
    channel_id: payload.channel_id,
    pickup_location: payload.pickupLocation,
    // Billing (same as shipping for D2C)
    billing_customer_name: payload.customerName,
    billing_last_name: "",
    billing_address: addr.addressLine1,
    billing_address_2: addr.addressLine2 || "",
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state,
    billing_country: addr.country || "India",
    billing_email: payload.customerEmail,
    billing_phone: payload.customerPhone,
    shipping_is_billing: 1,
    // Shipping
    shipping_customer_name: addr.fullName,
    shipping_last_name: "",
    shipping_address: addr.addressLine1,
    shipping_address_2: addr.addressLine2 || "",
    shipping_city: addr.city,
    shipping_pincode: addr.pincode,
    shipping_country: addr.country || "India",
    shipping_state: addr.state,
    shipping_email: payload.customerEmail,
    shipping_phone: addr.phone,
    // Items
    order_items: payload.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.sellingPrice,
      discount: 0,
      tax: 0,
      hsn: "",
    })),
    // Financials
    payment_method: payload.paymentMethod,
    sub_total: payload.totalAmount,
    // Dimensions & weight
    length: payload.lengthCm ?? 20,
    breadth: payload.breadthCm ?? 15,
    height: payload.heightCm ?? 5,
    weight: payload.weightKg,
  };

  const res = await shiprocketFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Shiprocket order creation failed (${res.status}): ${errText}`
    );
  }

  const data = (await res.json()) as {
    order_id?: number | string;
    shipment_id?: number | string;
    status?: string;
    awb_code?: string | null;
    courier_name?: string | null;
  };

  if (!data.order_id) {
    throw new Error(
      `Shiprocket returned no order_id: ${JSON.stringify(data)}`
    );
  }

  return {
    shiprocketOrderId: data.order_id,
    shipmentId: data.shipment_id ?? "",
    status: data.status ?? "created",
    awbCode: data.awb_code ?? null,
    courierName: data.courier_name ?? null,
  };
}

// ---------------------------------------------------------------------------
// Shipment Tracking by AWB
// ---------------------------------------------------------------------------

/**
 * Fetches live tracking data for a given AWB code.
 * Returns mock tracking data when credentials are not configured or AWB is simulated.
 */
export async function trackShipment(
  awbCode: string
): Promise<ShiprocketTrackingResult | null> {
  if (!isConfigured() || awbCode.startsWith("SRMOCK")) {
    return {
      awbCode,
      currentStatus: "In Transit",
      estimatedDeliveryDate: "Within 3-5 business days",
      activities: [
        {
          date: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          activity: "Package dispatched from fulfillment center (Simulated)",
          location: "Bengaluru Hub",
        },
      ],
    };
  }

  try {
    const res = await shiprocketFetch(`/courier/track/awb/${awbCode}`);
    if (!res.ok) return null;

    const body = (await res.json()) as {
      tracking_data?: {
        shipment_track?: Array<{
          current_status?: string;
          etd?: string;
        }>;
        shipment_track_activities?: Array<{
          date: string;
          activity: string;
          location: string;
        }>;
      };
    };

    const td = body.tracking_data;
    if (!td) return null;

    const info = td.shipment_track?.[0];

    return {
      awbCode,
      currentStatus: info?.current_status ?? "In Transit",
      estimatedDeliveryDate: info?.etd ?? null,
      activities: td.shipment_track_activities ?? [],
    };
  } catch (err) {
    console.error("[Shiprocket] trackShipment exception:", err);
    return null;
  }
}
