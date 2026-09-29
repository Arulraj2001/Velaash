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
 * NOTE: Placeholder default values.
 * TODO: Confirm actual free shipping threshold with client (VELAASH TRADER'S) before launch.
 */
export interface ShippingPolicySetting {
  free_shipping_threshold: number;
  standard_shipping_fee: number;
}

/**
 * Returns and exchanges policy configuration
 * NOTE: Placeholder default values.
 * TODO: Confirm actual return window and terms with client (VELAASH TRADER'S) before launch.
 */
export interface ReturnsPolicySetting {
  return_window_days: number;
  policy_description: string;
}

/**
 * Top notification announcement bar
 * TODO: Real promotions, coupons, or banners must be configured by client in admin before launch.
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

export interface SiteSettingsData {
  storeProfile: StoreProfileSetting;
  socialLinks: SocialLinksSetting;
  shippingPolicy: ShippingPolicySetting;
  returnsPolicy: ReturnsPolicySetting;
  announcement: AnnouncementSetting;
  paymentSettings: PaymentPolicySetting;
}
