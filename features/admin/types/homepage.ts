import { z } from "zod";

/**
 * ==============================================================================
 * HOMEPAGE BUILDER SCHEMAS & TYPES
 * ==============================================================================
 * Central Zod schemas for the 5 admin-manageable homepage section types.
 * ==============================================================================
 */

export const HOMEPAGE_SECTION_TYPES = [
  "hero_banner",
  "category_grid",
  "featured_products",
  "value_strip",
  "newsletter",
] as const;

export type HomepageSectionKind = (typeof HOMEPAGE_SECTION_TYPES)[number];

export const TRUST_ICON_KEYS = [
  "Truck",
  "RotateCcw",
  "ShieldCheck",
  "MessageCircle",
  "Sparkles",
  "Package",
  "Headphones",
  "Heart",
] as const;

export type TrustIconKey = (typeof TRUST_ICON_KEYS)[number];

// 1. Hero Banner Content Schema
export const HeroBannerContentSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required"),
  subtitle: z.string().trim().default(""),
  cta_text: z.string().trim().min(1, "CTA button label is required"),
  cta_link: z.string().trim().min(1, "CTA link URL is required"),
  secondary_cta_text: z.string().trim().optional().default(""),
  secondary_cta_link: z.string().trim().optional().default(""),
  bg_image: z.string().trim().min(1, "Background image URL is required"),
});

export type HeroBannerContent = z.infer<typeof HeroBannerContentSchema>;

// 2. Category Grid Content Schema
export const CategoryGridContentSchema = z.object({
  title: z.string().trim().default("Explore Categories"),
  subtitle: z.string().trim().default("Thoughtfully tailored pieces across modern everyday silhouettes."),
});

export type CategoryGridContent = z.infer<typeof CategoryGridContentSchema>;

// 3. Featured Products Content Schema
export const FeaturedProductsContentSchema = z.object({
  title: z.string().trim().default("Featured Arrivals"),
  subtitle: z.string().trim().default("Handpicked styles from our collection."),
  mode: z.enum(["auto", "manual"]).default("auto"),
  product_ids: z.array(z.string()).default([]),
  limit: z.coerce.number().min(2).max(24).default(8),
});

export type FeaturedProductsContent = z.infer<typeof FeaturedProductsContentSchema>;

// 4. Trust Strip / Value Strip Content Schema
export const TrustItemSchema = z.object({
  icon: z.enum(TRUST_ICON_KEYS).default("Truck"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
});

export type TrustItem = z.infer<typeof TrustItemSchema>;

export const ValueStripContentSchema = z.object({
  title: z.string().trim().default("Our Commitments"),
  items: z.array(TrustItemSchema).min(1, "At least 1 trust item is required").max(4, "Maximum 4 trust items allowed"),
});

export type ValueStripContent = z.infer<typeof ValueStripContentSchema>;

// 5. Newsletter Content Schema
export const NewsletterContentSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required"),
  subtext: z.string().trim().min(1, "Subtext description is required"),
});

export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;

// Database / View Representation
export interface AdminHomepageSection {
  id: string;
  section_type: HomepageSectionKind;
  title: string | null;
  display_order: number;
  is_active: boolean;
  content: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ReorderSectionUpdate {
  id: string;
  display_order: number;
}
