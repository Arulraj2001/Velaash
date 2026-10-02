/**
 * Analytics and Cookie Consent Types for Velaash
 */

export type CookieConsentChoice = "all" | "essential" | null;

export interface CookieConsentRecord {
  choice: "all" | "essential";
  timestamp: number;
}

export interface AnalyticsToolStatus {
  id: "ga4" | "meta_pixel" | "clarity";
  name: string;
  configured: boolean;
  publicId?: string;
  category: "analytics" | "advertising" | "heatmaps";
  description: string;
  dataCollected: string;
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
}

export interface ViewItemParams {
  productId: string;
  variantId?: string;
  name: string;
  category?: string;
  price: number;
  compareAtPrice?: number | null;
}

export interface AddToCartParams {
  productId: string;
  variantId?: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface BeginCheckoutParams {
  total: number;
  itemCount: number;
  coupon?: string;
  items: Array<{
    variantId?: string;
    productId: string;
    title: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
}

export interface PurchaseParams {
  orderNumber: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  currency?: string;
  items: Array<{
    id?: string;
    productId?: string;
    title: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
}
