import { createClient } from "@/lib/supabase/server";
import { BRAND, DEFAULT_ANNOUNCEMENT } from "@/lib/constants";
import type {
  SiteSettingsData,
  StoreProfileSetting,
  SocialLinksSetting,
  ShippingPolicySetting,
  ReturnsPolicySetting,
  AnnouncementSetting,
  PaymentPolicySetting,
  TaxPolicySetting,
  SeoDefaultsSetting,
  ShiprocketSetting,
  PageBannersSetting,
  PromoPopupSetting,
} from "../types";

export const DEFAULT_PROMO_POPUP_SETTING: PromoPopupSetting = {
  is_enabled: false,
  featured_coupon_id: null,
  popup_title: "Special Offer",
  popup_description: "Use this code at checkout to enjoy an exclusive discount on your order.",
  delay_seconds: 9,
};

export const DEFAULT_SHIPPING_POLICY: ShippingPolicySetting = {
  free_shipping_threshold: 999,
  standard_shipping_fee: 100,
};

export const DEFAULT_RETURNS_POLICY: ReturnsPolicySetting = {
  return_window_days: 7,
  policy_description:
    "We accept size exchanges and returns within 7 calendar days of receipt for items that are unused, unaltered, and retained with original tags intact.",
};

export const DEFAULT_ANNOUNCEMENT_SETTING: AnnouncementSetting = {
  is_enabled: true,
  text: DEFAULT_ANNOUNCEMENT.text,
  link: DEFAULT_ANNOUNCEMENT.link,
};

export const DEFAULT_PAYMENT_POLICY: PaymentPolicySetting = {
  razorpay_enabled: true,
  cod_enabled: true,
  cod_max_order_value: 20000,
  cod_handling_fee: 99,
};

export const DEFAULT_TAX_POLICY: TaxPolicySetting = {
  gst_enabled: true,
  gstin: null,
  default_gst_rate: 5.0,
};

export const DEFAULT_SEO_DEFAULTS: SeoDefaultsSetting = {
  meta_title: "Velaash — Everyday essentials for every home",
  meta_description:
    "Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.",
  keywords:
    "Velaash, Everyday essentials, Clothing for men and women, Pooja essentials, Brass essentials, ஆடை, கடை",
};

export const DEFAULT_SHIPROCKET_SETTING: ShiprocketSetting = {
  logistics_mode: "manual",
  pickup_postcode: "600001",
  pickup_location_name: "Primary",
  default_weight_kg: 0.5,
  auto_push_on_pack: false,
};

export const DEFAULT_PAGE_BANNERS_SETTING: PageBannersSetting = {
  shop: {},
  about: {},
  contact: {},
  faq: {},
  shipping_returns: {},
  track_order: {},
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  storeProfile: {
    name: BRAND.name,
    legal_name: BRAND.legalName,
    tagline: BRAND.tagline,
    email: BRAND.contactEmail,
    phone: BRAND.supportPhone,
    whatsapp_number: BRAND.whatsappNumber,
  },
  socialLinks: {
    instagram: BRAND.socialLinks.instagram,
    facebook: BRAND.socialLinks.facebook,
    pinterest: BRAND.socialLinks.pinterest,
  },
  shippingPolicy: DEFAULT_SHIPPING_POLICY,
  returnsPolicy: DEFAULT_RETURNS_POLICY,
  announcement: DEFAULT_ANNOUNCEMENT_SETTING,
  paymentSettings: DEFAULT_PAYMENT_POLICY,
  taxSettings: DEFAULT_TAX_POLICY,
  seoDefaults: DEFAULT_SEO_DEFAULTS,
  shiprocketSettings: DEFAULT_SHIPROCKET_SETTING,
  pageBanners: DEFAULT_PAGE_BANNERS_SETTING,
  promoPopup: DEFAULT_PROMO_POPUP_SETTING,
};

/**
 * Server query function to fetch store profile, social links, announcement text, policies,
 * tax configuration, and SEO defaults from the site_settings table in Supabase.
 *
 * Single source of truth across the application.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "store_profile",
        "social_links",
        "shipping_policy",
        "shipping_rules",
        "returns_policy",
        "announcement_bar",
        "payment_settings",
        "tax_settings",
        "seo_defaults",
        "shiprocket_settings",
        "page_banners",
        "promo_popup",
      ]);

    if (error || !data || data.length === 0) {
      return DEFAULT_SITE_SETTINGS;
    }

    const storeProfileRow = data.find((row) => row.key === "store_profile");
    const socialLinksRow = data.find((row) => row.key === "social_links");
    const shippingPolicyRow = data.find((row) => row.key === "shipping_policy");
    const shippingRulesRow = data.find((row) => row.key === "shipping_rules");
    const returnsPolicyRow = data.find((row) => row.key === "returns_policy");
    const announcementRow = data.find((row) => row.key === "announcement_bar");
    const paymentSettingsRow = data.find((row) => row.key === "payment_settings");
    const taxSettingsRow = data.find((row) => row.key === "tax_settings");
    const seoDefaultsRow = data.find((row) => row.key === "seo_defaults");
    const shiprocketRow = data.find((row) => row.key === "shiprocket_settings");

    const rawStoreProfile = (storeProfileRow?.value as Partial<StoreProfileSetting>) || {};
    const rawSocialLinks = (socialLinksRow?.value as Partial<SocialLinksSetting>) || {};
    const rawShippingPolicy =
      (shippingPolicyRow?.value as Partial<ShippingPolicySetting>) ||
      (shippingRulesRow?.value as Record<string, unknown>) ||
      {};
    const rawReturnsPolicy = (returnsPolicyRow?.value as Partial<ReturnsPolicySetting>) || {};
    const rawAnnouncement = (announcementRow?.value as Partial<AnnouncementSetting>) || {};
    const rawPayment = (paymentSettingsRow?.value as Partial<PaymentPolicySetting>) || {};
    const rawTax = (taxSettingsRow?.value as Partial<TaxPolicySetting>) || {};
    const rawSeo = (seoDefaultsRow?.value as Partial<SeoDefaultsSetting>) || {};

    const whatsappNumber =
      rawStoreProfile.whatsapp_number || rawStoreProfile.phone || BRAND.whatsappNumber;
    const storeProfile: StoreProfileSetting = {
      name: rawStoreProfile.name || BRAND.name,
      legal_name: rawStoreProfile.legal_name || BRAND.legalName,
      tagline:
        rawStoreProfile.tagline &&
        rawStoreProfile.tagline !== "Contemporary Elegance, Timeless Style"
          ? rawStoreProfile.tagline
          : BRAND.tagline,
      email: rawStoreProfile.email || BRAND.contactEmail,
      phone: rawStoreProfile.phone || BRAND.supportPhone,
      whatsapp_number: whatsappNumber,
      logo_url:
        rawStoreProfile.logo_url && rawStoreProfile.logo_url !== "/brand/logo.svg"
          ? rawStoreProfile.logo_url
          : "/logo.png",
      favicon_url: rawStoreProfile.favicon_url || "/favicon.ico",
    };

    const socialLinks: SocialLinksSetting = {
      instagram: rawSocialLinks.instagram || BRAND.socialLinks.instagram,
      facebook: rawSocialLinks.facebook || BRAND.socialLinks.facebook,
      pinterest: rawSocialLinks.pinterest || BRAND.socialLinks.pinterest,
    };

    // Free shipping threshold can come from free_shipping_threshold in shipping_policy or shipping_rules
    const shippingRecord = rawShippingPolicy as Record<string, unknown>;
    const freeShippingThresholdVal =
      typeof shippingRecord.free_shipping_threshold === "number"
        ? shippingRecord.free_shipping_threshold
        : typeof shippingRecord.free_shipping_threshold === "string"
          ? Number(shippingRecord.free_shipping_threshold)
          : DEFAULT_SHIPPING_POLICY.free_shipping_threshold;

    const standardShippingFeeVal =
      typeof shippingRecord.standard_shipping_fee === "number"
        ? shippingRecord.standard_shipping_fee
        : typeof shippingRecord.standard_shipping_charge === "number"
          ? (shippingRecord.standard_shipping_charge as number)
          : DEFAULT_SHIPPING_POLICY.standard_shipping_fee;

    const shippingPolicy: ShippingPolicySetting = {
      free_shipping_threshold: freeShippingThresholdVal,
      standard_shipping_fee: standardShippingFeeVal,
    };

    const returnsRecord = rawReturnsPolicy as Record<string, unknown>;
    const returnsPolicy: ReturnsPolicySetting = {
      return_window_days:
        typeof rawReturnsPolicy.return_window_days === "number"
          ? rawReturnsPolicy.return_window_days
          : DEFAULT_RETURNS_POLICY.return_window_days,
      policy_description:
        rawReturnsPolicy.policy_description ||
        (typeof returnsRecord.conditions === "string" ? returnsRecord.conditions : "") ||
        DEFAULT_RETURNS_POLICY.policy_description,
    };

    const announcement: AnnouncementSetting = {
      is_enabled: rawAnnouncement.is_enabled ?? DEFAULT_ANNOUNCEMENT_SETTING.is_enabled,
      text: rawAnnouncement.text || DEFAULT_ANNOUNCEMENT_SETTING.text,
      link: rawAnnouncement.link || DEFAULT_ANNOUNCEMENT_SETTING.link,
    };

    const paymentRecord = rawPayment as Record<string, unknown>;
    const paymentSettings: PaymentPolicySetting = {
      razorpay_enabled: rawPayment.razorpay_enabled ?? DEFAULT_PAYMENT_POLICY.razorpay_enabled,
      cod_enabled: rawPayment.cod_enabled ?? DEFAULT_PAYMENT_POLICY.cod_enabled,
      cod_max_order_value:
        typeof rawPayment.cod_max_order_value === "number"
          ? rawPayment.cod_max_order_value
          : DEFAULT_PAYMENT_POLICY.cod_max_order_value,
      cod_handling_fee:
        typeof rawPayment.cod_handling_fee === "number"
          ? rawPayment.cod_handling_fee
          : typeof paymentRecord.cod_fee === "number"
            ? paymentRecord.cod_fee
            : DEFAULT_PAYMENT_POLICY.cod_handling_fee,
    };

    const taxSettings: TaxPolicySetting = {
      gst_enabled: rawTax.gst_enabled ?? DEFAULT_TAX_POLICY.gst_enabled,
      gstin: rawTax.gstin ? String(rawTax.gstin).trim().toUpperCase() : null,
      default_gst_rate:
        typeof rawTax.default_gst_rate === "number"
          ? rawTax.default_gst_rate
          : DEFAULT_TAX_POLICY.default_gst_rate,
    };

    const rawTitle = rawSeo.meta_title?.trim();
    const rawDesc = rawSeo.meta_description?.trim();
    const rawKeywords = typeof rawSeo.keywords === "string" ? rawSeo.keywords.trim() : undefined;

    const seoDefaults: SeoDefaultsSetting = {
      meta_title:
        rawTitle && rawTitle !== "Velaash | Modern Everyday Luxury & Contemporary Clothing"
          ? rawTitle
          : DEFAULT_SEO_DEFAULTS.meta_title,
      meta_description:
        rawDesc && !rawDesc.includes("effortless silhouettes for your everyday and occasion wardrobe")
          ? rawDesc
          : DEFAULT_SEO_DEFAULTS.meta_description,
      keywords: rawKeywords || DEFAULT_SEO_DEFAULTS.keywords,
    };

    const rawShiprocket = (shiprocketRow?.value as Partial<ShiprocketSetting>) || {};
    const shiprocketSettings: ShiprocketSetting = {
      logistics_mode: rawShiprocket.logistics_mode ?? "manual",
      pickup_postcode: String(rawShiprocket.pickup_postcode || DEFAULT_SHIPROCKET_SETTING.pickup_postcode).trim(),
      pickup_location_name: String(
        rawShiprocket.pickup_location_name || DEFAULT_SHIPROCKET_SETTING.pickup_location_name
      ).trim(),
      default_weight_kg:
        typeof rawShiprocket.default_weight_kg === "number" && rawShiprocket.default_weight_kg > 0
          ? rawShiprocket.default_weight_kg
          : DEFAULT_SHIPROCKET_SETTING.default_weight_kg,
      auto_push_on_pack: Boolean(rawShiprocket.auto_push_on_pack),
    };

    const pageBannersRow = data.find((row) => row.key === "page_banners");
    let pageBanners: PageBannersSetting = DEFAULT_PAGE_BANNERS_SETTING;
    if (pageBannersRow && pageBannersRow.value && typeof pageBannersRow.value === "object") {
      pageBanners = {
        ...DEFAULT_PAGE_BANNERS_SETTING,
        ...(pageBannersRow.value as PageBannersSetting),
      };
    }

    const promoPopupRow = data.find((row) => row.key === "promo_popup");
    const rawPromoPopup = (promoPopupRow?.value as Partial<PromoPopupSetting>) || {};
    const promoPopup: PromoPopupSetting = {
      is_enabled: Boolean(rawPromoPopup.is_enabled),
      featured_coupon_id: rawPromoPopup.featured_coupon_id
        ? String(rawPromoPopup.featured_coupon_id).trim()
        : null,
      popup_title: rawPromoPopup.popup_title || DEFAULT_PROMO_POPUP_SETTING.popup_title,
      popup_description:
        rawPromoPopup.popup_description || DEFAULT_PROMO_POPUP_SETTING.popup_description,
      delay_seconds:
        typeof rawPromoPopup.delay_seconds === "number" && rawPromoPopup.delay_seconds >= 0
          ? rawPromoPopup.delay_seconds
          : DEFAULT_PROMO_POPUP_SETTING.delay_seconds,
    };

    return {
      storeProfile,
      socialLinks,
      shippingPolicy,
      returnsPolicy,
      announcement,
      paymentSettings,
      taxSettings,
      seoDefaults,
      shiprocketSettings,
      pageBanners,
      promoPopup,
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
