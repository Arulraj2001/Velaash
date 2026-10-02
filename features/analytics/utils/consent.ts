import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_CHANGE_EVENT,
  OPEN_COOKIE_PREFERENCES_EVENT,
} from "../constants";
import type { CookieConsentChoice, CookieConsentRecord, AnalyticsToolStatus } from "../types";

export function canLoadAnalyticsScripts(
  consent: CookieConsentChoice,
  isMounted: boolean,
  pathname: string | null
): boolean {
  const isAdminRoute = pathname === "/admin" || pathname?.startsWith("/admin/");
  return isMounted && consent === "all" && !isAdminRoute;
}

export function getAnalyticsScriptProviders(
  consent: CookieConsentChoice,
  isMounted: boolean,
  pathname: string | null,
  configuredIds: { ga4?: string; meta_pixel?: string; clarity?: string }
): Array<"ga4" | "meta_pixel" | "clarity"> {
  if (!canLoadAnalyticsScripts(consent, isMounted, pathname)) return [];

  return (Object.keys(configuredIds) as Array<keyof typeof configuredIds>).filter(
    (provider) => Boolean(configuredIds[provider]?.trim())
  );
}

/**
 * Retrieve the current cookie consent preference from localStorage.
 * Returns null if the user has not yet interacted with the banner.
 */
export function getStoredConsent(): CookieConsentChoice {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (parsed.choice === "all" || parsed.choice === "essential") {
      return parsed.choice;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store the user's cookie consent preference and dispatch a change event
 * so all active components and scripts update immediately.
 */
export function setStoredConsent(choice: "all" | "essential"): void {
  if (typeof window === "undefined") return;

  const record: CookieConsentRecord = {
    choice,
    timestamp: Date.now(),
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: { choice } })
    );
  } catch (err) {
    console.warn("[Velaash Consent] Failed to write consent to localStorage:", err);
  }
}

/**
 * Convenience check: returns true ONLY if the visitor explicitly granted
 * analytics consent ("all"). Returns false for "essential", null, or errors.
 */
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "all";
}

/**
 * Triggers the cookie preferences banner/dialog to open, allowing the user
 * to adjust or revoke their preferences at any time.
 */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}

/**
 * Inspects public environment variables to identify which analytics tools
 * are actually configured for this deployment.
 */
export function getConfiguredAnalyticsTools(): AnalyticsToolStatus[] {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "";
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "";

  return [
    {
      id: "ga4",
      name: "Google Analytics 4 (GA4)",
      configured: Boolean(ga4Id),
      publicId: ga4Id || undefined,
      category: "analytics",
      description: "Aggregated page navigation, dwell times, and e-commerce funnel metrics.",
      dataCollected: "Anonymized IP, device type, pages visited, referring URLs, and shopping interactions.",
    },
    {
      id: "meta_pixel",
      name: "Meta Pixel",
      configured: Boolean(pixelId),
      publicId: pixelId || undefined,
      category: "advertising",
      description: "Measures ad conversion performance and delivers relevant style updates on Instagram/Facebook.",
      dataCollected: "Page views, product interactions, and conversion events correlated with Meta ad delivery.",
    },
    {
      id: "clarity",
      name: "Microsoft Clarity",
      configured: Boolean(clarityId),
      publicId: clarityId || undefined,
      category: "heatmaps",
      description: "Visual heatmaps, scroll depth tracking, and anonymous session replays to improve UX.",
      dataCollected: "Click maps, scrolling activity, navigation friction, and anonymized interaction replays.",
    },
  ];
}
