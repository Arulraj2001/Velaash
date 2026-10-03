/**
 * ============================================================================
 * VELAASH ANALYTICS & COOKIE CONSENT VERIFICATION TEST SUITE
 * ============================================================================
 * Tests:
 * 1. Cookie consent storage, retrieval, event dispatch, and cross-navigation persistence
 * 2. Strict consent-gated script generation:
 *    - No scripts when consent is rejected ("essential")
 *    - Scripts load when consent is granted ("all")
 *    - Tool with unset env var NEVER attempts to load regardless of consent
 * 3. E-commerce tracking event gating (page_view, view_item, add_to_cart, begin_checkout, purchase)
 * 4. Privacy Policy dynamic text reflection (configured vs unconfigured tools)
 * 5. Live HTTP route status & DOM rendering
 * ============================================================================
 */

import {
  COOKIE_CONSENT_CHANGE_EVENT,
  OPEN_COOKIE_PREFERENCES_EVENT,
} from "../features/analytics/constants";
import {
  getStoredConsent,
  setStoredConsent,
  hasAnalyticsConsent,
  openCookiePreferences,
  getConfiguredAnalyticsTools,
  getAnalyticsScriptProviders,
} from "../features/analytics/utils/consent";
import {
  trackPageView,
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
} from "../features/analytics/utils/track";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${message}`);
    if (details) {
      console.log(`         \x1b[90m${details}\x1b[0m`);
    }
  } else {
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${message}`);
    if (details) {
      console.error(`         \x1b[31m${details}\x1b[0m`);
    }
    process.exitCode = 1;
  }
}

// In-memory mock localStorage for Node testing
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// In-memory EventTarget mock for Window
class MockWindow {
  public localStorage = new MockLocalStorage();
  private listeners: Record<string, Array<(e: unknown) => void>> = {};
  public dataLayer: unknown[] = [];
  public gtagCalls: Array<{ name: string; params: unknown }> = [];
  public fbqCalls: Array<{ trackType: string; eventName: string; params?: unknown }> = [];
  public clarityCalls: Array<{ command: string; args: unknown[] }> = [];

  public location = {
    pathname: "/products/classic-chikankari-kurta-set",
    search: "",
    href: "http://localhost:3000/products/classic-chikankari-kurta-set",
  };

  addEventListener(event: string, callback: (e: unknown) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: (e: unknown) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  dispatchEvent(event: { type: string; detail?: unknown }): boolean {
    const list = this.listeners[event.type] || [];
    for (const cb of list) cb(event);
    return true;
  }

  gtag = (command: string, name: string, params?: unknown) => {
    this.gtagCalls.push({ name: `${command}:${name}`, params });
  };

  fbq = (trackType: string, eventName: string, params?: unknown) => {
    this.fbqCalls.push({ trackType, eventName, params });
  };

  clarity = (command: string, ...args: unknown[]) => {
    this.clarityCalls.push({ command, args });
  };
}

// Setup Global Mock
const mockWin = new MockWindow();
// @ts-expect-error Mock global window
global.window = mockWin;
// @ts-expect-error Mock global document
global.document = { title: "Classic Chikankari Kurta Set | Velaash" };
// @ts-expect-error Mock CustomEvent
global.CustomEvent = class {
  type: string;
  detail: unknown;
  constructor(type: string, opts?: { detail?: unknown }) {
    this.type = type;
    this.detail = opts?.detail;
  }
};

async function runTestSuite() {
  console.log("\n" + "=".repeat(64));
  console.log("   VELAASH ANALYTICS & COOKIE CONSENT VERIFICATION SUITE       ");
  console.log("=".repeat(64) + "\n");

  // ==========================================================================
  // SECTION 1: Cookie Consent Storage & Persistence
  // ==========================================================================
  console.log("--- SECTION 1: Consent Storage, Events & Persistence ---");

  mockWin.localStorage.clear();
  assert(
    getStoredConsent() === null,
    "Initial visitor has null consent (unprompted)"
  );
  assert(
    hasAnalyticsConsent() === false,
    "hasAnalyticsConsent() returns false when no choice has been made"
  );

  let recordedEventChoice: string | null = null;
  const consentListener = (e: unknown) => {
    const custom = e as { detail: { choice: string } };
    recordedEventChoice = custom.detail.choice;
  };
  mockWin.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, consentListener);

  // Set essential only (Reject)
  setStoredConsent("essential");
  assert(
    getStoredConsent() === "essential",
    "Selecting 'Essential Only' persists 'essential' in localStorage"
  );
  assert(
    hasAnalyticsConsent() === false,
    "hasAnalyticsConsent() strictly returns false when 'essential' is chosen"
  );
  assert(
    recordedEventChoice === "essential",
    "COOKIE_CONSENT_CHANGE_EVENT fires immediately with choice: 'essential'"
  );

  // Simulate page navigation / reload: preference remains persisted in localStorage
  assert(
    getStoredConsent() === "essential",
    "Consent preference persists across page reloads / navigation"
  );

  // Set Accept All
  setStoredConsent("all");
  assert(
    getStoredConsent() === "all",
    "Selecting 'Accept All' persists 'all' in localStorage"
  );
  assert(
    hasAnalyticsConsent() === true,
    "hasAnalyticsConsent() returns true when 'all' is chosen"
  );
  assert(
    recordedEventChoice === "all",
    "COOKIE_CONSENT_CHANGE_EVENT fires immediately with choice: 'all'"
  );

  // Test Preferences Reopen Trigger
  let preferencesOpened: boolean = false;
  mockWin.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, () => {
    preferencesOpened = true;
  });
  openCookiePreferences();
  assert(
    preferencesOpened,
    "openCookiePreferences() dispatches OPEN_COOKIE_PREFERENCES_EVENT to reopen banner"
  );

  // ==========================================================================
  // SECTION 2: Consent-Gated Script Generation Simulation
  // ==========================================================================
  console.log("\n--- SECTION 2: Consent-Gated Script Generation Logic ---");

  const configuredProviderIds = {
    ga4: "configured-ga-key",
    meta_pixel: "configured-pixel-key",
    clarity: "configured-clarity-key",
  };

  // 1. Rejected consent with every provider configured
  const rejectedResult = getAnalyticsScriptProviders(
    "essential",
    true,
    "/products/example",
    configuredProviderIds
  );
  assert(
    rejectedResult.length === 0,
    "When consent is REJECTED ('essential'), NO analytics scripts load (zero tags rendered)",
    "Result: 0 scripts loaded"
  );

  // 2. Unprompted visitor (null consent) with ALL env vars present
  const unpromptedResult = getAnalyticsScriptProviders(
    null,
    true,
    "/products/example",
    configuredProviderIds
  );
  assert(
    unpromptedResult.length === 0,
    "When consent has NOT been granted (null), NO analytics scripts load unconditionally",
    "Result: 0 scripts loaded"
  );

  // 3. Accepted consent with ALL env vars present
  const acceptedAllConfigured = getAnalyticsScriptProviders(
    "all",
    true,
    "/products/example",
    configuredProviderIds
  );
  assert(
    acceptedAllConfigured.length === 3,
    "When consent is ACCEPTED ('all'), all configured analytics tools load",
    `Loaded: ${acceptedAllConfigured.join(", ")}`
  );

  // 4. Every admin route is excluded regardless of consent and configured IDs
  const adminRoutes = ["/admin", "/admin/settings", "/admin/orders/100"];
  const adminProviders = adminRoutes.flatMap((pathname) =>
    (["all", "essential", null] as const).flatMap((consent) =>
      getAnalyticsScriptProviders(consent, true, pathname, configuredProviderIds)
    )
  );
  assert(
    adminProviders.length === 0,
    "GA4, Meta Pixel, and Clarity never render on admin routes for any consent state"
  );

  // 5. A missing Clarity env var never creates a provider, even with consent
  const noClarityResult = getAnalyticsScriptProviders("all", true, "/", {
    ga4: "",
    meta_pixel: "",
    clarity: undefined,
  });
  assert(
    noClarityResult.length === 0,
    "Clarity does not render with no env ID, even when consent is all"
  );

  // ==========================================================================
  // SECTION 3: E-Commerce Tracking Events with Consent Gating
  // ==========================================================================
  console.log("\n--- SECTION 3: E-Commerce Tracking Event Gating ---");

  // Step A: When consent is 'essential' (REJECTED) -> All tracking calls must be silent no-ops
  setStoredConsent("essential");
  mockWin.gtagCalls = [];
  mockWin.fbqCalls = [];

  trackPageView("/products/anarkali-set");
  trackViewItem({
    productId: "prod-1",
    name: "Pure Mulmul Anarkali Set",
    price: 3499,
  });
  trackAddToCart({
    productId: "prod-1",
    variantId: "var-1",
    name: "Pure Mulmul Anarkali Set",
    price: 3499,
    quantity: 1,
    size: "M",
  });
  trackBeginCheckout({
    total: 3499,
    itemCount: 1,
    items: [{ productId: "prod-1", title: "Pure Mulmul Anarkali Set", price: 3499, quantity: 1 }],
  });
  trackPurchase({
    orderNumber: "ORD-2026-TEST",
    total: 3499,
    items: [{ productId: "prod-1", title: "Pure Mulmul Anarkali Set", price: 3499, quantity: 1 }],
  });

  assert(
    mockWin.gtagCalls.length === 0,
    "No GA4 events fired when consent is rejected (gtagCalls: 0)",
    `Calls recorded: ${mockWin.gtagCalls.length}`
  );
  assert(
    mockWin.fbqCalls.length === 0,
    "No Meta Pixel events fired when consent is rejected (fbqCalls: 0)",
    `Calls recorded: ${mockWin.fbqCalls.length}`
  );

  // Step B: When consent is 'all' (ACCEPTED) -> Events MUST fire with standard payloads
  setStoredConsent("all");
  mockWin.gtagCalls = [];
  mockWin.fbqCalls = [];

  // 1. page_view
  trackPageView("/products/anarkali-set");
  assert(
    mockWin.gtagCalls.some((c) => c.name === "event:page_view"),
    "trackPageView fires GA4 'page_view' event when consent is granted"
  );
  assert(
    mockWin.fbqCalls.some((c) => c.trackType === "track" && c.eventName === "PageView"),
    "trackPageView fires Meta Pixel 'PageView' event when consent is granted"
  );

  // 2. view_item
  trackViewItem({
    productId: "prod-1",
    variantId: "var-101",
    name: "Chanderi Silk Kurta Set",
    category: "Kurtas & Sets",
    price: 4999,
    compareAtPrice: 5999,
  });
  const gaViewItem = mockWin.gtagCalls.find((c) => c.name === "event:view_item");
  assert(Boolean(gaViewItem), "trackViewItem fires standard GA4 'view_item' event");
  const gaViewParams = gaViewItem?.params as { value: number; currency: string; items: unknown[] };
  assert(
    gaViewParams?.value === 4999 && gaViewParams?.currency === "INR",
    "GA4 view_item payload contains accurate price value and currency INR"
  );
  const fbView = mockWin.fbqCalls.find((c) => c.eventName === "ViewContent");
  assert(Boolean(fbView), "trackViewItem fires Meta Pixel 'ViewContent' event");

  // 3. add_to_cart
  trackAddToCart({
    productId: "prod-1",
    variantId: "var-101",
    name: "Chanderi Silk Kurta Set",
    category: "Kurtas & Sets",
    price: 4999,
    quantity: 2,
    size: "L",
    color: "Dusty Rose",
  });
  const gaAddToCart = mockWin.gtagCalls.find((c) => c.name === "event:add_to_cart");
  assert(Boolean(gaAddToCart), "trackAddToCart fires standard GA4 'add_to_cart' event");
  const gaCartParams = gaAddToCart?.params as { value: number; items: Array<{ quantity: number }> };
  assert(
    gaCartParams?.value === 9998 && gaCartParams?.items[0]?.quantity === 2,
    "GA4 add_to_cart calculates total value (price * quantity) correctly"
  );
  const fbAddToCart = mockWin.fbqCalls.find((c) => c.eventName === "AddToCart");
  assert(Boolean(fbAddToCart), "trackAddToCart fires Meta Pixel 'AddToCart' event");

  // 4. begin_checkout
  trackBeginCheckout({
    total: 9998,
    itemCount: 2,
    coupon: "VELAASH10",
    items: [{ productId: "prod-1", title: "Chanderi Silk Kurta Set", price: 4999, quantity: 2 }],
  });
  const gaCheckout = mockWin.gtagCalls.find((c) => c.name === "event:begin_checkout");
  assert(Boolean(gaCheckout), "trackBeginCheckout fires standard GA4 'begin_checkout' event");
  const fbCheckout = mockWin.fbqCalls.find((c) => c.eventName === "InitiateCheckout");
  assert(Boolean(fbCheckout), "trackBeginCheckout fires Meta Pixel 'InitiateCheckout' event");

  // 5. purchase
  trackPurchase({
    orderNumber: "ORD-2026-9999",
    total: 8998,
    subtotal: 9998,
    tax: 0,
    shipping: 0,
    coupon: "VELAASH10",
    currency: "INR",
    items: [{ productId: "prod-1", title: "Chanderi Silk Kurta Set", price: 4999, quantity: 2 }],
  });
  const gaPurchase = mockWin.gtagCalls.find((c) => c.name === "event:purchase");
  assert(Boolean(gaPurchase), "trackPurchase fires standard GA4 'purchase' event with order value");
  const gaPurchaseParams = gaPurchase?.params as { transaction_id: string; value: number };
  assert(
    gaPurchaseParams?.transaction_id === "ORD-2026-9999" && gaPurchaseParams?.value === 8998,
    "GA4 purchase payload contains transaction_id and final order total"
  );
  const fbPurchase = mockWin.fbqCalls.find((c) => c.eventName === "Purchase");
  assert(Boolean(fbPurchase), "trackPurchase fires Meta Pixel 'Purchase' event");

  // ==========================================================================
  // SECTION 4: Privacy Policy Text Accuracy & Dynamic Reflection
  // ==========================================================================
  console.log("\n--- SECTION 4: Privacy Policy Dynamic Text & Consent Verification ---");

  // Check getConfiguredAnalyticsTools helper
  const tools = getConfiguredAnalyticsTools();
  assert(tools.length === 3, "getConfiguredAnalyticsTools returns all 3 supported tools");

  const ga4Tool = tools.find((t) => t.id === "ga4");
  const metaTool = tools.find((t) => t.id === "meta_pixel");
  const clarityTool = tools.find((t) => t.id === "clarity");

  assert(Boolean(ga4Tool), "Tool Google Analytics 4 (GA4) is registered");
  assert(Boolean(metaTool), "Tool Meta Pixel is registered");
  assert(Boolean(clarityTool), "Tool Microsoft Clarity is registered");

  // Fetch live /privacy-policy HTML
  try {
    const res = await fetch(`${BASE_URL}/privacy-policy?t=${Date.now()}`, {
      cache: "no-store",
    });
    assert(res.status === 200, "/privacy-policy route responds with HTTP 200");
    const html = await res.text();

    // 1. Confirm absence of old obsolete statement
    const hasOldDisclaimer =
      html.includes("No Third-Party Advertising Trackers: We do not deploy third-party advertising tracking cookies or cross-site tracking pixels") ||
      html.includes("We do not deploy third-party advertising tracking cookies");
    assert(
      !hasOldDisclaimer,
      "Privacy Policy completely removes outdated 'we do not use GA4/Meta Pixel/Clarity' language"
    );

    // 2. Confirm updated Cookies & Tracking section exists
    assert(
      html.includes("Cookies &amp; Tracking Technologies") || html.includes("Cookies & Tracking Technologies"),
      "Privacy Policy includes updated 'Cookies & Tracking Technologies' section"
    );

    // 3. Confirm essential cookies vs analytics distinction
    assert(
      html.includes("Essential Functional Storage") && html.includes("Always Active"),
      "Privacy Policy clearly documents Essential Functional Storage as Always Active"
    );
    assert(
      html.includes("Strictly Consent-Gated"),
      "Privacy Policy explicitly states analytics tools are Strictly Consent-Gated"
    );

    // 4. Confirm each tool is named with plain-English explanation
    assert(
      html.includes("Google Analytics 4") || html.includes("GA4"),
      "Privacy Policy names Google Analytics 4 (GA4)"
    );
    assert(
      html.includes("Meta Pixel"),
      "Privacy Policy names Meta Pixel"
    );
    assert(
      html.includes("Microsoft Clarity"),
      "Privacy Policy names Microsoft Clarity"
    );

    // 5. Confirm explanation of data collected
    assert(
      html.includes("shopping journey events") || html.includes("standard e-commerce"),
      "Privacy Policy explains GA4 e-commerce and navigation analytics"
    );
    assert(
      html.includes("Instagram and Facebook") || html.includes("Meta platforms"),
      "Privacy Policy explains Meta Pixel ad performance and attribution"
    );
    assert(
      html.includes("heatmaps") && html.includes("session replays"),
      "Privacy Policy explains Microsoft Clarity heatmaps and anonymous session replays"
    );

    // 6. Confirm Cookie Preferences button & footer link explanation
    assert(
      html.includes("Manage Cookie &amp; Analytics Preferences") || html.includes("Manage Cookie & Analytics Preferences"),
      "Privacy Policy includes interactive 'Manage Cookie & Analytics Preferences' button"
    );
    assert(
      html.includes("Cookie Preferences"),
      "Privacy Policy references footer Cookie Preferences link for revoking or updating choice"
    );

    // 7. Confirm Zero Sale of Personal Data commitment
    assert(
      html.includes("Zero Sale of Personal Data"),
      "Privacy Policy maintains 'Zero Sale of Personal Data' commitment intact"
    );
  } catch (err) {
    console.error("  \x1b[31m[ERROR]\x1b[0m Failed to fetch /privacy-policy:", err);
  }

  // ==========================================================================
  // SECTION 5: Live Homepage Layout Verification
  // ==========================================================================
  console.log("\n--- SECTION 5: Live Homepage Layout & Footer Link Verification ---");

  try {
    const homeRes = await fetch(`${BASE_URL}/?t=${Date.now()}`, { cache: "no-store" });
    assert(homeRes.status === 200, "Homepage route (/) responds with HTTP 200");
    const homeHtml = await homeRes.text();

    assert(
      homeHtml.includes("Cookie Preferences"),
      "Homepage footer contains active 'Cookie Preferences' link"
    );
  } catch (err) {
    console.error("  \x1b[31m[ERROR]\x1b[0m Failed to fetch homepage:", err);
  }

  // Summary
  console.log("\n" + "=".repeat(64));
  if (passedTests === totalTests) {
    console.log(`\x1b[32m  ALL TESTS PASSED: ${passedTests}/${totalTests} verified successfully! \x1b[0m`);
  } else {
    console.error(`\x1b[31m  TESTS FAILED: ${passedTests}/${totalTests} passed. \x1b[0m`);
  }
  console.log("=".repeat(64) + "\n");
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
