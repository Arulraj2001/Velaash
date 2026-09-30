/**
 * ==============================================================================
 * Sentry PII & Sensitive Data Scrubber
 * ==============================================================================
 *
 * Strict data protection guard ensuring customer privacy and financial security.
 * Prevents full customer addresses, phone numbers, payment secrets, and
 * Razorpay signatures from being sent in Sentry event contexts or breadcrumbs.
 */

import type { ErrorEvent, Breadcrumb } from "@sentry/nextjs";

const REDACTED = "[REDACTED]";
const REDACTED_PHONE = "[REDACTED_PHONE]";
const REDACTED_SIGNATURE = "[REDACTED_SIGNATURE]";
const REDACTED_TOKEN = "[REDACTED_TOKEN]";

/** Keys that must always have their values completely redacted */
const SENSITIVE_KEY_REGEX =
  /^(address|addressline1|addressline2|street|shippingaddress|billingaddress|pincode|postalcode|zip|zipcode|phone|phonenumber|mobile|tele|telephone|card|cardnumber|cvv|cvc|expiry|signature|razorpaysignature|razorpaypaymentid|paymentid|keysecret|webhooksecret|secret|password|auth|authorization|cookie|token|accesstoken|refreshtoken)$/i;

/** Returns true if a key name represents sensitive customer PII or secrets */
export function isSensitiveKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  return (
    SENSITIVE_KEY_REGEX.test(normalized) ||
    normalized.endsWith("secret") ||
    normalized.endsWith("password") ||
    normalized.endsWith("token") ||
    normalized.endsWith("signature") ||
    normalized.endsWith("address") ||
    normalized.endsWith("phone")
  );
}

/** Regex pattern for 10-digit Indian phone numbers (standalone or with country code) */
const INDIAN_PHONE_REGEX = /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g;

/** Regex pattern for 64-character HMAC-SHA256 hex signatures (e.g. Razorpay signatures) */
const HMAC_SHA256_HEX_REGEX = /\b[a-f0-9]{64}\b/gi;

/** Regex pattern for Bearer tokens or JWTs */
const BEARER_OR_JWT_REGEX = /(?:Bearer\s+[A-Za-z0-9\-_=]+|eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+)/g;

/**
 * Scrubs any string of known sensitive patterns (phone numbers, signatures, tokens).
 */
export function scrubString(str: string): string {
  if (!str || typeof str !== "string") return str;

  return str
    .replace(INDIAN_PHONE_REGEX, REDACTED_PHONE)
    .replace(HMAC_SHA256_HEX_REGEX, REDACTED_SIGNATURE)
    .replace(BEARER_OR_JWT_REGEX, REDACTED_TOKEN);
}

/**
 * Recursively scrubs an object, array, or primitive of sensitive keys and values.
 */
export function scrubDeep<T>(value: T, depth = 0): T {
  if (depth > 8) return value; // Prevent cyclic stack overflow
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return scrubString(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubDeep(item, depth + 1)) as unknown as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        result[k] = REDACTED;
      } else {
        result[k] = scrubDeep(v, depth + 1);
      }
    }
    return result as unknown as T;
  }

  return value;
}

/**
 * Sentry beforeSend hook: scrubs customer PII and payment secrets from error events.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent | null {
  if (!event) return null;

  try {
    // 1. Scrub extra context data
    if (event.extra) {
      event.extra = scrubDeep(event.extra);
    }

    // 2. Scrub user information (preserve user ID, redact email/name/ip/phone)
    if (event.user) {
      if (event.user.email) event.user.email = "[SCRUBBED_EMAIL]";
      if (event.user.username) event.user.username = "[SCRUBBED_NAME]";
      if (event.user.ip_address) event.user.ip_address = "[SCRUBBED_IP]";
      delete (event.user as Record<string, unknown>)["phone"];
      delete (event.user as Record<string, unknown>)["address"];
    }

    // 3. Scrub request headers, cookies, and query params
    if (event.request) {
      if (event.request.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.authorization) h.authorization = REDACTED;
        if (h.cookie) h.cookie = REDACTED;
        if (h["x-razorpay-signature"]) h["x-razorpay-signature"] = REDACTED;
      }
      if (event.request.cookies) {
        if (typeof event.request.cookies === "string") {
          (event.request as unknown as { cookies: string }).cookies = REDACTED;
        } else {
          event.request.cookies = scrubDeep(event.request.cookies);
        }
      }
      if (event.request.query_string) {
        if (typeof event.request.query_string === "string") {
          event.request.query_string = scrubString(event.request.query_string);
        } else {
          event.request.query_string = scrubDeep(event.request.query_string);
        }
      }
      if (event.request.data) {
        event.request.data = scrubDeep(event.request.data);
      }
    }

    // 4. Scrub custom contexts
    if (event.contexts) {
      event.contexts = scrubDeep(event.contexts);
    }

    // 5. Scrub breadcrumbs inside event
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => scrubBreadcrumb(b));
    }

    // 6. Scrub message string if present
    if (event.message) {
      event.message = scrubString(event.message);
    }
  } catch (err) {
    console.error("[SentryScrubber] Error scrubbing Sentry event:", err);
  }

  return event;
}

/**
 * Sentry beforeBreadcrumb hook: scrubs sensitive data from user/navigation breadcrumbs.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb) return breadcrumb;

  try {
    if (breadcrumb.data) {
      breadcrumb.data = scrubDeep(breadcrumb.data);
    }
    if (breadcrumb.message) {
      breadcrumb.message = scrubString(breadcrumb.message);
    }
  } catch (err) {
    console.error("[SentryScrubber] Error scrubbing breadcrumb:", err);
  }

  return breadcrumb;
}
