export interface StoreProfileSetting {
  name: string;
  legal_name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_url: string;
  logo_url?: string;
  favicon_url?: string;
}

export interface SocialLinksSetting {
  instagram: string;
  facebook: string;
  whatsapp: string;
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

export interface SiteSettingsData {
  storeProfile: StoreProfileSetting;
  socialLinks: SocialLinksSetting;
  shippingPolicy: ShippingPolicySetting;
  returnsPolicy: ReturnsPolicySetting;
  announcement: AnnouncementSetting;
  paymentSettings: PaymentPolicySetting;
  taxSettings: TaxPolicySetting;
  seoDefaults: SeoDefaultsSetting;
}

export type SiteSettings = SiteSettingsData;
