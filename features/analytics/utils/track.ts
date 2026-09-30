import { hasAnalyticsConsent } from "./consent";
import type {
  ViewItemParams,
  AddToCartParams,
  BeginCheckoutParams,
  PurchaseParams,
} from "../types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Track page views across route changes.
 * Automatically respects cookie consent.
 */
export function trackPageView(url?: string): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const pagePath = url || window.location.pathname + window.location.search;

  // 1. Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
}

/**
 * Standard GA4 view_item event & Meta Pixel ViewContent.
 */
export function trackViewItem({
  productId,
  variantId,
  name,
  category,
  price,
}: ViewItemParams): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const itemId = variantId || productId;

  // 1. GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", "view_item", {
      currency: "INR",
      value: price,
      items: [
        {
          item_id: itemId,
          item_name: name,
          item_category: category,
          price,
          quantity: 1,
        },
      ],
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_name: name,
      content_category: category,
      content_ids: [itemId],
      content_type: "product",
      value: price,
      currency: "INR",
    });
  }
}

/**
 * Standard GA4 add_to_cart event & Meta Pixel AddToCart.
 */
export function trackAddToCart({
  productId,
  variantId,
  name,
  category,
  price,
  quantity,
  size,
  color,
}: AddToCartParams): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const totalValue = price * quantity;
  const variantDescriptor = [size, color].filter(Boolean).join(" / ");

  // 1. GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", "add_to_cart", {
      currency: "INR",
      value: totalValue,
      items: [
        {
          item_id: variantId || productId,
          item_name: name,
          item_category: category,
          item_variant: variantDescriptor || undefined,
          price,
          quantity,
        },
      ],
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      content_name: name,
      content_category: category,
      content_ids: [variantId || productId],
      content_type: "product",
      value: totalValue,
      currency: "INR",
    });
  }
}

/**
 * Standard GA4 begin_checkout event & Meta Pixel InitiateCheckout.
 */
export function trackBeginCheckout({
  total,
  itemCount,
  coupon,
  items,
}: BeginCheckoutParams): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  // 1. GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      currency: "INR",
      value: total,
      coupon: coupon || undefined,
      items: items.map((item) => ({
        item_id: item.variantId || item.productId,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity,
        item_variant: [item.size, item.color].filter(Boolean).join(" / ") || undefined,
      })),
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      value: total,
      currency: "INR",
      num_items: itemCount,
      content_ids: items.map((i) => i.variantId || i.productId),
      content_type: "product",
    });
  }
}

/**
 * Standard GA4 purchase event & Meta Pixel Purchase.
 */
export function trackPurchase({
  orderNumber,
  total,
  tax,
  shipping,
  coupon,
  currency = "INR",
  items,
}: PurchaseParams): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  // 1. GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: orderNumber,
      value: total,
      currency,
      tax: tax || 0,
      shipping: shipping || 0,
      coupon: coupon || undefined,
      items: items.map((item) => ({
        item_id: item.id || item.productId || orderNumber,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity,
        item_variant: [item.size, item.color].filter(Boolean).join(" / ") || undefined,
      })),
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value: total,
      currency,
      content_type: "product",
      content_ids: items.map((i) => i.id || i.productId || orderNumber),
      num_items: items.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
    });
  }
}
