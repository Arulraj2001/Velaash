import crypto from "crypto";
import { env } from "@/lib/env";

/**
 * GUEST ORDER CONFIRMATION ACCESS CONTROL & PII PROTECTION ARCHITECTURE
 * ---------------------------------------------------------------------
 * In high-converting Indian e-commerce, guest checkout is essential to minimize checkout friction.
 * However, if a guest order confirmation page at `/order-confirmation/VEL-2026-01001` naively displays
 * full customer names, phone numbers, and home street addresses to anyone holding the URL, it creates
 * a severe privacy vulnerability:
 *   1. Order numbers often follow predictable patterns (e.g. VEL-YYYY-XXXXX), enabling scraping.
 *   2. Shared URLs, browser histories, or shoulder-surfing could expose private customer PII.
 *
 * OUR MULTI-TIER ACCESS MODEL:
 * ----------------------------
 * 1. Tier 1 (Authenticated Owner):
 *    If the visitor is logged into a Supabase customer account that owns the order, they are granted
 *    FULL ACCESS unconditionally on all visits.
 *
 * 2. Tier 2 (First-Visit Guest / Checkout Session):
 *    Immediately following successful checkout or payment verification, the server issues an HTTP-only,
 *    secure, sameSite=lax cookie (`velaash_order_access_${orderNumber}`) containing a tamper-proof HMAC-SHA256
 *    token valid for 30 minutes (and also supports a fallback `?token=...` query param).
 *    On this initial visit, the guest customer enjoys FULL ACCESS to review their order and shipping address.
 *
 * 3. Tier 3 (Direct / Repeat Unauthenticated Visit):
 *    If a guest (or external party) accesses the order confirmation URL directly at a later time
 *    without the session cookie/token and without logging in:
 *    - Full street address is masked (e.g. "••••••••••••••••")
 *    - Phone number is masked (e.g. "•••••• 4321")
 *    - Email is masked (e.g. "a••••••@example.com")
 *    - City, State, and Pincode remain visible so the customer can verify the destination region.
 *    - Order items, quantities, totals, and fulfillment timeline remain visible so the customer can track progress.
 *    - An informative security banner explains why PII is masked and prompts them to log in for full details.
 */

const FALLBACK_SECRET = "velaash_secure_guest_order_access_secret_2026";

function getAccessSecret(): string {
  return (
    env.RAZORPAY_KEY_SECRET ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RAZORPAY_KEY_SECRET ||
    FALLBACK_SECRET
  );
}

/**
 * Generate a cryptographically signed access token for an order.
 */
export function generateOrderAccessToken(orderNumber: string, salt: string = "initial_session"): string {
  const secret = getAccessSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderNumber}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Verify if a provided access token is authentic for the given order number.
 */
export function verifyOrderAccessToken(
  orderNumber: string,
  providedToken: string,
  salt: string = "initial_session"
): boolean {
  if (!providedToken || typeof providedToken !== "string") return false;

  try {
    const expectedToken = generateOrderAccessToken(orderNumber, salt);
    if (providedToken.length !== expectedToken.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(providedToken, "utf8"),
      Buffer.from(expectedToken, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Mask a 10-digit phone number: e.g. "9876543210" -> "•••••• 3210"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "••••••";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `•••••• ${digits.slice(-4)}`;
}

/**
 * Mask an email address: e.g. "ananya.roy@example.com" -> "a•••••••@example.com"
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return "••••@••••.com";
  const [local, domain] = email.split("@");
  if (!local || local.length <= 1) return `•@${domain}`;
  return `${local[0]}${"•".repeat(Math.min(local.length - 1, 6))}@${domain}`;
}

/**
 * Mask a street address: e.g. "Flat 12B, Palm Meadows" -> "••••••••••••••••"
 */
export function maskStreetAddress(addressLine?: string | null): string {
  if (!addressLine) return "••••••••••••";
  return "••••••••••••••••";
}
