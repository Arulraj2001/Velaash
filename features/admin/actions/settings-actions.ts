"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
  ensureProductImagesBucket,
} from "../utils/storage";
import {
  StoreProfileSchema,
  SocialLinksSchema,
  ShippingSettingsSchema,
  ReturnsSettingsSchema,
  PaymentSettingsSchema,
  TaxSettingsSchema,
  AnnouncementSettingsSchema,
  SeoDefaultsSchema,
  ShiprocketSettingsSchema,
  PageBannersSchema,
  type StoreProfileFormData,
  type SocialLinksFormData,
  type ShippingSettingsFormData,
  type ReturnsSettingsFormData,
  type PaymentSettingsFormData,
  type TaxSettingsFormData,
  type AnnouncementSettingsFormData,
  type SeoDefaultsFormData,
  type ShiprocketSettingsFormData,
  type PageBannersFormData,
} from "../types/settings";

export interface SettingsActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Revalidates public customer-facing paths and admin settings.
 */
function revalidateSettingsPaths() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/shop");
}

/**
 * Helper to upsert a site_settings row by key.
 */
import type { Json } from "@/types/database.types";

async function upsertSiteSetting(
  key: string,
  value: Record<string, unknown>,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("site_settings").upsert(
      {
        key,
        value: value as unknown as Json,
        description: description || `Site setting for ${key}`,
        is_public: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error(`Error saving site setting '${key}':`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database write failed.";
    return { success: false, error: msg };
  }
}

/**
 * Update 1. Store Profile
 * Permission: manage_settings (Owner only).
 */
export async function updateStoreProfileSettingsAction(
  input: StoreProfileFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = StoreProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid store profile details.",
      };
    }

    const res = await upsertSiteSetting(
      "store_profile",
      parsed.data,
      "Core business and brand identity info"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Store profile updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update store profile.",
    };
  }
}

/**
 * Update 2. Social Links
 * Permission: manage_settings (Owner only).
 */
export async function updateSocialLinksSettingsAction(
  input: SocialLinksFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = SocialLinksSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid social links.",
      };
    }

    const res = await upsertSiteSetting(
      "social_links",
      parsed.data,
      "Official social media handles and communication channels"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Social links updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update social links.",
    };
  }
}

/**
 * Update 3. Shipping & Delivery
 * Permission: manage_settings (Owner only).
 * Single source of truth: updates both 'shipping_policy' and 'shipping_rules'.
 */
export async function updateShippingSettingsAction(
  input: ShippingSettingsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = ShippingSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid shipping settings.",
      };
    }

    // Save to shipping_policy
    const res1 = await upsertSiteSetting(
      "shipping_policy",
      {
        free_shipping_threshold: parsed.data.free_shipping_threshold,
        standard_shipping_fee: parsed.data.standard_shipping_fee,
        cod_available: true,
      },
      "Shipping rates and free shipping threshold"
    );

    // Also sync shipping_rules for legacy compatibility
    await upsertSiteSetting(
      "shipping_rules",
      {
        free_shipping_threshold: parsed.data.free_shipping_threshold,
        standard_shipping_charge: parsed.data.standard_shipping_fee,
        standard_shipping_fee: parsed.data.standard_shipping_fee,
      },
      "Shipping rates and free threshold in INR"
    );

    if (!res1.success) {
      return { success: false, error: res1.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Shipping rates and threshold updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update shipping settings.",
    };
  }
}

/**
 * Update 4. Returns Policy
 * Permission: manage_settings (Owner only).
 */
export async function updateReturnsSettingsAction(
  input: ReturnsSettingsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = ReturnsSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid returns policy.",
      };
    }

    const res = await upsertSiteSetting(
      "returns_policy",
      parsed.data,
      "Customer returns and exchange policy terms"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Returns policy updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update returns policy.",
    };
  }
}

/**
 * Update 5. Payment Settings (COD & Razorpay)
 * Permission: manage_settings (Owner only).
 */
export async function updatePaymentSettingsAction(
  input: PaymentSettingsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = PaymentSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid payment settings.",
      };
    }

    const res = await upsertSiteSetting(
      "payment_settings",
      parsed.data,
      "Payment gateway and Cash-On-Delivery limits"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Payment settings updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update payment settings.",
    };
  }
}

/**
 * Update 6. Tax / GST Settings
 * Permission: manage_settings (Owner only).
 */
export async function updateTaxSettingsAction(
  input: TaxSettingsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = TaxSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid GST configuration.",
      };
    }

    const cleanGstin = parsed.data.gstin ? parsed.data.gstin.trim().toUpperCase() : null;

    const res = await upsertSiteSetting(
      "tax_settings",
      {
        gst_enabled: parsed.data.gst_enabled,
        gstin: parsed.data.gst_enabled ? cleanGstin : null,
        default_gst_rate: 5.0,
      },
      "Indian GST tax configuration"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Tax & GST settings updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update tax settings.",
    };
  }
}

/**
 * Update 7. Announcement Bar
 * Permission: manage_settings (Owner only).
 */
export async function updateAnnouncementSettingsAction(
  input: AnnouncementSettingsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = AnnouncementSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid announcement settings.",
      };
    }

    const res = await upsertSiteSetting(
      "announcement_bar",
      parsed.data,
      "Top announcement and promotional banner"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Announcement banner updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update announcement banner.",
    };
  }
}

/**
 * Update 8. SEO Defaults
 * Permission: manage_settings (Owner only).
 */
export async function updateSeoSettingsAction(
  input: SeoDefaultsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = SeoDefaultsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid SEO defaults.",
      };
    }

    const res = await upsertSiteSetting(
      "seo_defaults",
      parsed.data,
      "Default search engine meta tags and site description"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "SEO defaults updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update SEO defaults.",
    };
  }
}

/**
 * Update 9. Logistics & Shiprocket Settings
 * Permission: manage_settings (Owner only).
 */
export async function updateShiprocketSettingsAction(
  input: ShiprocketSettingsFormData
): Promise<SettingsActionResult> {
  try {
    await requireAdmin("manage_settings");

    const parsed = ShiprocketSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid Shiprocket logistics settings.",
      };
    }

    const res = await upsertSiteSetting(
      "shiprocket_settings",
      parsed.data,
      "Shiprocket logistics integration settings and warehouse dispatch details"
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidateSettingsPaths();
    return { success: true, message: "Logistics and Shiprocket settings updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update Shiprocket settings.",
    };
  }
}

/**
 * Upload brand logo or favicon to Supabase Storage.
 * Permission: manage_settings (Owner only).
 */
export async function uploadBrandAssetAction(
  formData: FormData,
  assetType: "logo" | "favicon" | "banner" = "banner"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin("manage_settings");

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No asset file provided." };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: "File size exceeds the 5MB maximum limit." };
    }

    await ensureProductImagesBucket();
    const adminClient = createAdminClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || (assetType === "favicon" ? "ico" : "png");
    const filename = `${assetType}-${Date.now()}.${ext}`;
    const storagePath = `brand/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload failed:", uploadErr);
      return { success: false, error: "Failed to upload asset to storage." };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload brand asset.",
    };
  }
}

/**
 * 10. Update Page Banners (Images and custom headings per page)
 */
export async function updatePageBannersAction(
  raw: unknown
): Promise<SettingsActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, error: "Unauthorized: Admin privileges required." };
    }

    const parsed = PageBannersSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const result = await upsertSiteSetting(
      "page_banners",
      parsed.data as Record<string, unknown>,
      "Hero banner image and header settings for customer pages"
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidateSettingsPaths();
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/faq");
    revalidatePath("/shipping-returns");
    revalidatePath("/track-order");
    revalidatePath("/privacy-policy");
    revalidatePath("/terms-conditions");

    return { success: true, message: "Page banners updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update page banners.",
    };
  }
}

