import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import type { SiteSettingsData, StoreProfileSetting, SocialLinksSetting } from "../types";

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
};

/**
 * Server query function to fetch store profile and contact information
 * from the site_settings table in Supabase.
 *
 * Sourced dynamically from site_settings so the admin/client can modify
 * WhatsApp, email, or social links directly without code deployments.
 * Falls back safely to BRAND constants during build prerendering or database offline.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["store_profile", "social_links"]);

    if (error || !data || data.length === 0) {
      return DEFAULT_SITE_SETTINGS;
    }

    const storeProfileRow = data.find((row) => row.key === "store_profile");
    const socialLinksRow = data.find((row) => row.key === "social_links");

    const rawStoreProfile = (storeProfileRow?.value as Partial<StoreProfileSetting>) || {};
    const rawSocialLinks = (socialLinksRow?.value as Partial<SocialLinksSetting>) || {};

    const storeProfile: StoreProfileSetting = {
      name: rawStoreProfile.name || BRAND.name,
      legal_name: rawStoreProfile.legal_name || BRAND.legalName,
      tagline: rawStoreProfile.tagline || BRAND.tagline,
      // Flag: contact email should be updated to professional domain email when ready
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

    return {
      storeProfile,
      socialLinks,
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
