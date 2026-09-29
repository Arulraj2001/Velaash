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

export interface SiteSettingsData {
  storeProfile: StoreProfileSetting;
  socialLinks: SocialLinksSetting;
  shippingPolicy: ShippingPolicySetting;
  returnsPolicy: ReturnsPolicySetting;
}
