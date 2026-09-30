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
  "occasion_strip",
  "category_grid",
  "featured_products",
  "couture_spotlight",
  "testimonials",
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

// 1. Hero Slide & Hero Banner Content Schema
export const HeroSlideSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  tag: z.string().trim().default("New Season Arrivals"),
  headline: z.string().trim().min(1, "Headline is required"),
  subtitle: z.string().trim().default(""),
  cta_text: z.string().trim().min(1, "CTA button label is required"),
  cta_link: z.string().trim().min(1, "CTA link URL is required"),
  secondary_cta_text: z.string().trim().optional().default(""),
  secondary_cta_link: z.string().trim().optional().default(""),
  bg_image: z.string().trim().min(1, "Background image URL is required"),
});

export type HeroSlide = z.infer<typeof HeroSlideSchema>;

export const HeroBannerContentSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required"),
  subtitle: z.string().trim().default(""),
  cta_text: z.string().trim().min(1, "CTA button label is required"),
  cta_link: z.string().trim().min(1, "CTA link URL is required"),
  secondary_cta_text: z.string().trim().optional().default(""),
  secondary_cta_link: z.string().trim().optional().default(""),
  bg_image: z.string().trim().min(1, "Background image URL is required"),
  slides: z.array(HeroSlideSchema).optional().default([]),
});

export type HeroBannerContent = z.infer<typeof HeroBannerContentSchema>;

// 2. Occasion Strip Content Schema
export const OccasionCardSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  name: z.string().trim().min(1, "Occasion name is required"),
  subtitle: z.string().trim().default(""),
  slug: z.string().trim().default(""),
  image: z.string().trim().min(1, "Image URL is required"),
  href: z.string().trim().min(1, "Link URL is required"),
});

export type OccasionCard = z.infer<typeof OccasionCardSchema>;

export const OccasionStripContentSchema = z.object({
  title: z.string().trim().default("Shop by Occasion"),
  subtitle: z.string().trim().default("Thoughtfully curated palettes and cuts styled for life's special celebrations and effortless daily poise."),
  items: z.array(OccasionCardSchema).default([]),
});

export type OccasionStripContent = z.infer<typeof OccasionStripContentSchema>;

// 3. Category Grid Content Schema
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

// 4. Couture Spotlight (The Craft of Velaash / Brand Story) Content Schema
export const CoutureSpotlightContentSchema = z.object({
  tagline: z.string().trim().default("Artisanal Craft & Slow Fashion"),
  headline: z.string().trim().min(1, "Headline is required").default("Consciously Crafted. Designed for Everyday Grace."),
  description: z.string().trim().default(
    "At Velaash, we reject disposable seasonal trends. Every piece is envisioned as an heirloom essential — pairing the airy breathability of authentic Indian textiles with sleek, contemporary cuts that seamlessly carry you from boardroom poise to festive soirees."
  ),
  image_url: z.string().trim().default("https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"),
  detail_badge_title: z.string().trim().default("The Velaash Touch"),
  detail_badge_text: z.string().trim().default("Hand-finished hems, concealed seams, and breathable natural textiles curated for lasting poise."),
  cta_text: z.string().trim().default("Explore The Full Catalog"),
  cta_link: z.string().trim().default("/shop"),
});

export type CoutureSpotlightContent = z.infer<typeof CoutureSpotlightContentSchema>;

// 5. Client Testimonials Content Schema
export const TestimonialItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  name: z.string().trim().min(1, "Customer name is required"),
  location: z.string().trim().default("India"),
  rating: z.coerce.number().min(1).max(5).default(5),
  review: z.string().trim().min(1, "Review text is required"),
  product_name: z.string().trim().optional().default(""),
});

export type TestimonialItem = z.infer<typeof TestimonialItemSchema>;

export const TestimonialsContentSchema = z.object({
  headline: z.string().trim().default("Cherished by Our Patrons"),
  subtitle: z.string().trim().default("Real experiences from women who celebrate everyday grace in our tailored silhouettes."),
  items: z.array(TestimonialItemSchema).default([]),
});

export type TestimonialsContent = z.infer<typeof TestimonialsContentSchema>;

// 6. Trust Strip / Value Strip Content Schema
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

// 7. Newsletter Content Schema
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
