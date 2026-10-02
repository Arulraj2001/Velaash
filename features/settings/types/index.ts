export interface StoreProfileSetting {
  name: string;
  legal_name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  logo_url?: string;
  favicon_url?: string;
}

export interface SocialLinksSetting {
  instagram: string;
  facebook: string;
  pinterest?: string;
}

/**
 * Shipping policy configuration
 * Single source of truth across Cart, Checkout, and PDP.
 */
export interface ShippingPolicySetting {
  free_shipping_threshold: number;
  standard_shipping_fee: number;
}

/**
 * Returns and exchanges policy configuration
 * Single source of truth across PDP accordion, cart badges, and returns pages.
 */
export interface ReturnsPolicySetting {
  return_window_days: number;
  policy_description: string;
}

/**
 * Top notification announcement bar
 */
export interface AnnouncementSetting {
  is_enabled: boolean;
  text: string;
  link: string;
}

/**
 * Payment and Cash-on-Delivery configuration
 */
export interface PaymentPolicySetting {
  razorpay_enabled: boolean;
  cod_enabled: boolean;
  cod_max_order_value: number;
  cod_handling_fee: number;
}

/**
 * Tax and Indian GST configuration
 * Feeds invoice PDF generation (Tax Invoice vs Bill of Supply).
 */
export interface TaxPolicySetting {
  gst_enabled: boolean;
  gstin: string | null;
  default_gst_rate?: number;
}

/**
 * Site-wide SEO fallback configuration
 */
export interface SeoDefaultsSetting {
  meta_title: string;
  meta_description: string;
}

/**
 * Logistics provider mode toggle.
 * "manual" = free self-ship, no API needed.
 * "shiprocket" = paid Shiprocket API integration.
 */
export type LogisticsMode = "manual" | "shiprocket";

/**
 * Logistics and Shiprocket integration configuration
 */
export interface ShiprocketSetting {
  /** Active logistics provider. Defaults to "manual" if absent. */
  logistics_mode: LogisticsMode;
  pickup_postcode: string;
  pickup_location_name: string;
  default_weight_kg: number;
  auto_push_on_pack: boolean;
}

/**
 * Editorial header banner image and title configuration per customer page
 */
export interface PageBannerItem {
  image_url?: string;
  headline?: string;
  subtitle?: string;
}

export interface PageBannersSetting {
  shop?: PageBannerItem;
  about?: PageBannerItem;
  contact?: PageBannerItem;
  faq?: PageBannerItem;
  shipping_returns?: PageBannerItem;
  track_order?: PageBannerItem;
}

/**
 * Site-wide promotional offer popup configuration
 */
export interface PromoPopupSetting {
  is_enabled: boolean;
  featured_coupon_id: string | null;
  popup_title: string;
  popup_description: string;
  delay_seconds?: number;
}

export interface SiteSettingsData {
  storeProfile: StoreProfileSetting;
  socialLinks: SocialLinksSetting;
  shippingPolicy: ShippingPolicySetting;
  returnsPolicy: ReturnsPolicySetting;
  announcement: AnnouncementSetting;
  paymentSettings: PaymentPolicySetting;
  taxSettings: TaxPolicySetting;
  seoDefaults: SeoDefaultsSetting;
  shiprocketSettings: ShiprocketSetting;
  pageBanners: PageBannersSetting;
  promoPopup: PromoPopupSetting;
}

export type SiteSettings = SiteSettingsData;


