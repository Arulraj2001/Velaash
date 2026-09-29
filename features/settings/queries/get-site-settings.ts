import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import type {
  SiteSettingsData,
  StoreProfileSetting,
  SocialLinksSetting,
  ShippingPolicySetting,
  ReturnsPolicySetting,
} from "../types";

/**
 * TODO: [PRE-LAUNCH VERIFICATION REQUIRED WITH CLIENT: VELAASH TRADER'S]
 * The free shipping threshold (₹999) and return window (7 days) are placeholder defaults.
 * Confirm actual business terms and policies with the client before launch.
 */
export const DEFAULT_SHIPPING_POLICY: ShippingPolicySetting = {
  free_shipping_threshold: 999, // Placeholder default — MUST be confirmed by client
  standard_shipping_fee: 100,
};

export const DEFAULT_RETURNS_POLICY: ReturnsPolicySetting = {
  return_window_days: 7, // Placeholder default — MUST be confirmed by client
  policy_description:
    "We accept size exchanges and returns within 7 calendar days of receipt for items that are unused, unaltered, and retained with original tags intact.",
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  storeProfile: {
    name: BRAND.name,
    legal_name: BRAND.legalName,
    tagline: BRAND.tagline,
    // Temporary contact email until a professional domain email is provisioned
    email: BRAND.contactEmail,
    phone: BRAND.supportPhone,
    whatsapp_number: BRAND.whatsappNumber,
    whatsapp_url: BRAND.whatsappUrl,
  },
  socialLinks: {
    instagram: BRAND.socialLinks.instagram,
    facebook: BRAND.socialLinks.facebook,
    whatsapp: BRAND.socialLinks.whatsapp,
    pinterest: BRAND.socialLinks.pinterest,
  },
  shippingPolicy: DEFAULT_SHIPPING_POLICY,
  returnsPolicy: DEFAULT_RETURNS_POLICY,
};

/**
 * Server query function to fetch store profile, social links, and policies
 * from the site_settings table in Supabase.
 *
 * Editable via site_settings in Supabase or admin panel so policies are dynamic.
 * Falls back safely to DEFAULT_SITE_SETTINGS during build prerendering or database offline.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["store_profile", "social_links", "shipping_policy", "returns_policy"]);

    if (error || !data || data.length === 0) {
      return DEFAULT_SITE_SETTINGS;
    }

    const storeProfileRow = data.find((row) => row.key === "store_profile");
    const socialLinksRow = data.find((row) => row.key === "social_links");
    const shippingPolicyRow = data.find((row) => row.key === "shipping_policy");
    const returnsPolicyRow = data.find((row) => row.key === "returns_policy");

    const rawStoreProfile = (storeProfileRow?.value as Partial<StoreProfileSetting>) || {};
    const rawSocialLinks = (socialLinksRow?.value as Partial<SocialLinksSetting>) || {};
    const rawShippingPolicy = (shippingPolicyRow?.value as Partial<ShippingPolicySetting>) || {};
    const rawReturnsPolicy = (returnsPolicyRow?.value as Partial<ReturnsPolicySetting>) || {};

    const storeProfile: StoreProfileSetting = {
      name: rawStoreProfile.name || BRAND.name,
      legal_name: rawStoreProfile.legal_name || BRAND.legalName,
      tagline: rawStoreProfile.tagline || BRAND.tagline,
      email: rawStoreProfile.email || BRAND.contactEmail,
      phone: rawStoreProfile.phone || BRAND.supportPhone,
      whatsapp_number:
        rawStoreProfile.whatsapp_number || rawStoreProfile.phone || BRAND.whatsappNumber,
      whatsapp_url:
        rawStoreProfile.whatsapp_url ||
        `https://wa.me/${(rawStoreProfile.whatsapp_number || BRAND.whatsappNumber).replace(/\D/g, "")}`,
    };

    const socialLinks: SocialLinksSetting = {
      instagram: rawSocialLinks.instagram || BRAND.socialLinks.instagram,
      facebook: rawSocialLinks.facebook || BRAND.socialLinks.facebook,
      whatsapp:
        rawSocialLinks.whatsapp || rawStoreProfile.whatsapp_url || BRAND.socialLinks.whatsapp,
      pinterest: rawSocialLinks.pinterest || BRAND.socialLinks.pinterest,
    };

    const shippingPolicy: ShippingPolicySetting = {
      free_shipping_threshold:
        typeof rawShippingPolicy.free_shipping_threshold === "number"
          ? rawShippingPolicy.free_shipping_threshold
          : DEFAULT_SHIPPING_POLICY.free_shipping_threshold,
      standard_shipping_fee:
        typeof rawShippingPolicy.standard_shipping_fee === "number"
          ? rawShippingPolicy.standard_shipping_fee
          : DEFAULT_SHIPPING_POLICY.standard_shipping_fee,
    };

    const returnsPolicy: ReturnsPolicySetting = {
      return_window_days:
        typeof rawReturnsPolicy.return_window_days === "number"
          ? rawReturnsPolicy.return_window_days
          : DEFAULT_RETURNS_POLICY.return_window_days,
      policy_description:
        rawReturnsPolicy.policy_description || DEFAULT_RETURNS_POLICY.policy_description,
    };

    return {
      storeProfile,
      socialLinks,
      shippingPolicy,
      returnsPolicy,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    return DEFAULT_SITE_SETTINGS;
  }
}
