import { z } from "zod";

/**
 * ==============================================================================
 * SITE SETTINGS SCHEMAS & TYPES
 * ==============================================================================
 * Central Zod validation schemas for each editable settings section.
 * Enforces strict typing and data validation for Owner-only settings.
 * ==============================================================================
 */

// 1. Store Profile
export const StoreProfileSchema = z.object({
  name: z.string().trim().min(1, "Store display name is required"),
  legal_name: z.string().trim().min(1, "Legal business name is required"),
  tagline: z.string().trim().default("Contemporary Elegance, Handcrafted in India"),
  email: z.string().trim().email("Please provide a valid contact email address"),
  phone: z.string().trim().min(8, "Please enter a valid phone number"),
  whatsapp_number: z.string().trim().min(8, "Please enter a valid WhatsApp number"),
  logo_url: z.string().trim().optional().default("/logo.png"),
  favicon_url: z.string().trim().optional().default("/favicon.ico"),
});

export type StoreProfileFormData = z.infer<typeof StoreProfileSchema>;

// 2. Social Links
export const SocialLinksSchema = z.object({
  instagram: z.string().trim().url("Please enter a valid Instagram URL").or(z.literal("")),
  facebook: z.string().trim().url("Please enter a valid Facebook URL").or(z.literal("")),
  pinterest: z.string().trim().url("Please enter a valid Pinterest URL").or(z.literal("")),
});

export type SocialLinksFormData = z.infer<typeof SocialLinksSchema>;

// 3. Shipping & Delivery
export const ShippingSettingsSchema = z.object({
  free_shipping_threshold: z.coerce
    .number()
    .min(0, "Free shipping threshold cannot be negative"),
  standard_shipping_fee: z.coerce
    .number()
    .min(0, "Standard shipping fee cannot be negative"),
});

export type ShippingSettingsFormData = z.infer<typeof ShippingSettingsSchema>;

// 4. Returns Policy
export const ReturnsSettingsSchema = z.object({
  return_window_days: z.coerce
    .number()
    .int("Return window must be a whole number")
    .min(0, "Return window cannot be negative")
    .max(180, "Return window cannot exceed 180 days"),
  policy_description: z
    .string()
    .trim()
    .min(10, "Policy description must be at least 10 characters"),
});

export type ReturnsSettingsFormData = z.infer<typeof ReturnsSettingsSchema>;

// 5. Payments (COD & Razorpay)
export const PaymentSettingsSchema = z.object({
  cod_enabled: z.boolean(),
  cod_max_order_value: z.coerce
    .number()
    .min(0, "COD max order value cannot be negative"),
  cod_handling_fee: z.coerce
    .number()
    .min(0, "COD handling fee cannot be negative"),
  razorpay_enabled: z.boolean(),
});

export type PaymentSettingsFormData = z.infer<typeof PaymentSettingsSchema>;

// 6. Tax / GST
export const TaxSettingsSchema = z
  .object({
    gst_enabled: z.boolean(),
    gstin: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.gst_enabled) {
        if (!data.gstin || data.gstin.trim().length === 0) {
          return false;
        }
        // Indian GSTIN format: 2 numbers, 5 letters, 4 numbers, 1 letter, 1 alphanumeric, 'Z', 1 alphanumeric
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinRegex.test(data.gstin.trim().toUpperCase());
      }
      return true;
    },
    {
      message: "A valid 15-character Indian GSTIN (e.g. 33ABCDE1234F1Z5) is required when GST is enabled",
      path: ["gstin"],
    }
  );

export type TaxSettingsFormData = z.infer<typeof TaxSettingsSchema>;

// 7. Announcement Bar
export const AnnouncementSettingsSchema = z.object({
  is_enabled: z.boolean(),
  text: z.string().trim().min(1, "Announcement text is required"),
  link: z.string().trim().default("/shop"),
});

export type AnnouncementSettingsFormData = z.infer<typeof AnnouncementSettingsSchema>;

export const SeoDefaultsSchema = z.object({
  meta_title: z.string().trim().min(3, "Meta title must be at least 3 characters"),
  meta_description: z
    .string()
    .trim()
    .min(10, "Meta description must be at least 10 characters"),
  keywords: z.string().trim().optional(),
});

export type SeoDefaultsFormData = z.infer<typeof SeoDefaultsSchema>;

// 9. Logistics & Shiprocket Settings
export const ShiprocketSettingsSchema = z.object({
  /** "manual" = self-ship (free, default). "shiprocket" = paid API. */
  logistics_mode: z.enum(["manual", "shiprocket"]).default("manual"),
  pickup_postcode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Warehouse pickup pincode must be a 6-digit Indian postal code"),
  pickup_location_name: z
    .string()
    .trim()
    .min(1, "Pickup location name is required (must match Shiprocket dashboard)"),
  default_weight_kg: z.coerce
    .number()
    .positive("Default package weight must be greater than 0 kg")
    .max(50, "Default package weight cannot exceed 50 kg"),
  auto_push_on_pack: z.boolean().default(false),
});

export type ShiprocketSettingsFormData = z.infer<typeof ShiprocketSettingsSchema>;

// 10. Page Banners
export const PageBannerItemSchema = z.object({
  image_url: z.string().trim().optional().default(""),
  headline: z.string().trim().optional().default(""),
  subtitle: z.string().trim().optional().default(""),
});

export const PageBannersSchema = z.object({
  shop: PageBannerItemSchema.optional().default({}),
  about: PageBannerItemSchema.optional().default({}),
  contact: PageBannerItemSchema.optional().default({}),
  faq: PageBannerItemSchema.optional().default({}),
  shipping_returns: PageBannerItemSchema.optional().default({}),
  track_order: PageBannerItemSchema.optional().default({}),
});

export type PageBannersFormData = z.infer<typeof PageBannersSchema>;

// 11. Promo Offer Popup
export const PromoPopupSettingsSchema = z.object({
  is_enabled: z.boolean(),
  featured_coupon_id: z.string().trim().nullable().optional(),
  popup_title: z.string().trim().min(1, "Popup title is required"),
  popup_description: z.string().trim().min(1, "Popup description is required"),
  delay_seconds: z.coerce.number().min(0).max(60).default(9),
});

export type PromoPopupSettingsFormData = z.infer<typeof PromoPopupSettingsSchema>;


