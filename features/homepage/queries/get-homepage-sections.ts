import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import type { LiveHomepageSection } from "../types";
import type { HomepageSectionKind } from "@/features/admin/types/homepage";

export const DEFAULT_LIVE_HOMEPAGE_SECTIONS: LiveHomepageSection[] = [
  {
    id: "default-hero",
    section_type: "hero_banner",
    title: "Everyday essentials for every home",
    display_order: 1,
    is_active: true,
    content: {
      headline: "Everyday essentials for every home",
      subtitle:
        "Clothing for men and women, plus traditional pooja and brass essentials.",
      cta_text: "Explore Collection",
      cta_link: "/shop",
      secondary_cta_text: "Kurtas & Sets",
      secondary_cta_link: "/collections/kurtas-sets",
      bg_image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
      slides: [
        {
          id: "slide-1",
          tag: "New Season Arrivals",
          headline: "Everyday essentials for every home",
          subtitle:
            "Clothing for men and women, plus traditional pooja and brass essentials.",
          cta_text: "Explore Collection",
          cta_link: "/shop",
          secondary_cta_text: "Kurtas & Sets",
          secondary_cta_link: "/collections/kurtas-sets",
          bg_image:
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
        },
        {
          id: "slide-2",
          tag: "Festive Capsule",
          headline: "Timeless Grace, Artisanal Craft",
          subtitle:
            "Handcrafted threadwork, rich jewel tones, and opulent fabrics tailored for your special celebrations.",
          cta_text: "Shop Festive",
          cta_link: "/collections/kurtas-sets",
          secondary_cta_text: "Dresses",
          secondary_cta_link: "/collections/dresses",
          bg_image:
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85",
        },
        {
          id: "slide-3",
          tag: "Contemporary Co-Ords",
          headline: "The Art of Breathable Dressing",
          subtitle:
            "Pure cottons and relaxed co-ords designed to keep you poised from morning meetings to evening dinners.",
          cta_text: "Discover Co-ords",
          cta_link: "/collections/co-ord-sets",
          secondary_cta_text: "View All",
          secondary_cta_link: "/shop",
          bg_image:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85",
        },
      ],
    },
  },
  {
    id: "default-occasion-strip",
    section_type: "occasion_strip",
    title: "Shop by Occasion",
    display_order: 2,
    is_active: true,
    content: {
      title: "Shop by Occasion",
      subtitle:
        "Thoughtfully curated palettes and cuts styled for life's special celebrations and effortless daily poise.",
      items: [
        {
          id: "occ-1",
          name: "Festive Capsule",
          subtitle: "Zari, Silk Blends & Brocades",
          slug: "festive",
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
          href: "/collections/kurtas-sets",
        },
        {
          id: "occ-2",
          name: "Workday Grace",
          subtitle: "Clean cuts & breathable comfort",
          slug: "workwear",
          image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
          href: "/shop?sort=newest",
        },
        {
          id: "occ-3",
          name: "Evening Soirées",
          subtitle: "Statement Co-Ords & Drapes",
          slug: "evening",
          image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
          href: "/collections/co-ord-sets",
        },
        {
          id: "occ-4",
          name: "Casual Brunches",
          subtitle: "Airy silhouettes & subtle prints",
          slug: "brunch",
          image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80",
          href: "/collections/dresses",
        },
      ],
    },
  },
  {
    id: "default-category-grid",
    section_type: "category_grid",
    title: "Explore by Category",
    display_order: 3,
    is_active: true,
    content: {
      title: "Explore by Category",
      subtitle: "Thoughtfully tailored pieces across modern everyday silhouettes.",
    },
  },
  {
    id: "default-featured-products",
    section_type: "featured_products",
    title: "Featured Arrivals",
    display_order: 3,
    is_active: true,
    content: {
      title: "Featured Arrivals",
      subtitle: "Handpicked styles from our collection.",
      mode: "auto",
      product_ids: [],
      limit: 8,
    },
  },
  {
    id: "default-couture-spotlight",
    section_type: "couture_spotlight",
    title: "The Craft of Velaash",
    display_order: 4,
    is_active: true,
    content: {
      tagline: "Artisanal Craft & Slow Fashion",
      headline: "Consciously Crafted. Designed for Everyday Grace.",
      description:
        "At Velaash, we reject disposable seasonal trends. Every piece is envisioned as an heirloom essential — pairing the airy breathability of authentic Indian textiles with sleek, contemporary cuts that seamlessly carry you from boardroom poise to festive soirees.",
      image_url:
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
      detail_badge_title: "The Velaash Touch",
      detail_badge_text:
        "Hand-finished hems, concealed seams, and breathable natural textiles curated for lasting poise.",
      cta_text: "Explore The Full Catalog",
      cta_link: "/shop",
    },
  },
  {
    id: "default-testimonials",
    section_type: "testimonials",
    title: "Customer Reviews",
    display_order: 5,
    is_active: true,
    content: {
      headline: "Loved by Our Customers",
      subtitle: "Real experiences from customers who celebrate quality and everyday grace.",
      items: [
        {
          id: "1",
          name: "Ananya Sharma",
          location: "Mumbai",
          rating: 5,
          review:
            "The fabric quality of the Chanderi Kurta set is simply unmatched. It breathes so well even during humid days, and the subtle gold zari trim feels wonderfully luxurious without being over the top.",
          product_name: "Chanderi Anarkali Set",
        },
        {
          id: "2",
          name: "Ritu Mathur",
          location: "Bangalore",
          rating: 5,
          review:
            "Wore my Velaash co-ord set to an evening gallery preview and received countless compliments! The drape is exceptionally flattering, and the stitching is high-end boutique caliber.",
          product_name: "Silk Blend Co-Ord Ensemble",
        },
        {
          id: "3",
          name: "Dr. Divya Patel",
          location: "Ahmedabad",
          rating: 5,
          review:
            "Fast dispatch, gorgeous unboxing packaging, and the cotton weave is heavenly. It holds its silhouette beautifully after multiple gentle washes. Velaash is my new staple.",
          product_name: "Everyday Classic Straight Kurta",
        },
      ],
    },
  },
  {
    id: "default-value-strip",
    section_type: "value_strip",
    title: "Our Commitments",
    display_order: 6,
    is_active: true,
    content: {
      title: "Our Commitments",
      items: [
        {
          icon: "Truck",
          title: "Pan-India Delivery",
          description: "Reliable domestic shipping across all serviceable PIN codes.",
        },
        {
          icon: "RotateCcw",
          title: "Easy Returns",
          description: "Hassle-free return and exchange assistance for unworn items.",
        },
        {
          icon: "ShieldCheck",
          title: "Secure Payments",
          description: "100% encrypted checkout with UPI, Cards, and Net Banking.",
        },
        {
          icon: "MessageCircle",
          title: "WhatsApp Support",
          description: "Direct assistance and sizing guidance on WhatsApp.",
        },
      ],
    },
  },
  {
    id: "default-newsletter",
    section_type: "newsletter",
    title: "Stay In Touch",
    display_order: 7,
    is_active: true,
    content: {
      headline: "Join the Velaash Circle",
      subtext:
        "Subscribe to receive updates on new arrivals, seasonal collections, and wardrobe inspiration directly to your inbox.",
    },
  },
];

/**
 * Internal fetch — runs against Supabase directly.
 * Do not call outside of the cached wrappers below.
 */
async function fetchHomepageSections(): Promise<LiveHomepageSection[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_LIVE_HOMEPAGE_SECTIONS;
    }

    const seenTypes = new Set<string>();
    const sections: LiveHomepageSection[] = [];

    for (const row of data) {
      let section_type: HomepageSectionKind = row.section_type as HomepageSectionKind;
      if ((row.section_type as string) === "custom_html" || (row.section_type as string) === "newsletter") {
        section_type = "newsletter";
      }

      // Filter to known section types
      if (
        ![
          "hero_banner",
          "occasion_strip",
          "category_grid",
          "featured_products",
          "couture_spotlight",
          "testimonials",
          "value_strip",
          "newsletter",
        ].includes(section_type)
      ) {
        continue;
      }

      // Avoid rendering duplicate seeded sections of the same type on the live homepage
      if (seenTypes.has(section_type)) {
        continue;
      }
      seenTypes.add(section_type);

      const rawContent =
        row.content && typeof row.content === "object" && !Array.isArray(row.content)
          ? (row.content as Record<string, unknown>)
          : {};

      // Normalize content to broader lifestyle positioning
      const content = { ...rawContent };
      if (section_type === "hero_banner") {
        if (content.headline === "Modern Everyday Luxury") {
          content.headline = "Everyday essentials for every home";
        }
        if (
          typeof content.subtitle === "string" &&
          (content.subtitle.includes("contemporary wardrobe essentials") ||
            content.subtitle.includes("Effortless silhouettes"))
        ) {
          content.subtitle =
            "Clothing for men and women, plus traditional pooja and brass essentials.";
        }
        if (Array.isArray(content.slides)) {
          content.slides = (content.slides as Record<string, unknown>[]).map((s) => ({
            ...s,
            headline:
              s.headline === "Modern Everyday Luxury"
                ? "Everyday essentials for every home"
                : (s.headline as string) ?? "",
            subtitle:
              typeof s.subtitle === "string" &&
              (s.subtitle.includes("contemporary wardrobe essentials") ||
                s.subtitle.includes("Effortless silhouettes"))
                ? "Clothing for men and women, plus traditional pooja and brass essentials."
                : (s.subtitle as string) ?? "",
          }));
        }
      } else if (section_type === "testimonials") {
        if (
          typeof content.subtitle === "string" &&
          (content.subtitle.includes("women who celebrate everyday grace") ||
            content.subtitle.includes("patrons who celebrate quality") ||
            content.subtitle.includes("celebrate everyday grace"))
        ) {
          content.subtitle =
            "Real experiences from customers who celebrate quality and everyday grace.";
        }
        if (content.headline === "Cherished by Our Patrons") {
          content.headline = "Loved by Our Customers";
        }
      }

      sections.push({
        id: row.id,
        section_type,
        title:
          row.title === "Modern Everyday Luxury"
            ? "Everyday essentials for every home"
            : row.title === "Patron Testimonials" || row.title === "Patron Stories"
              ? "Customer Reviews"
              : row.title,
        display_order: row.display_order,
        is_active: Boolean(row.is_active),
        content,
      });
    }

    // Sort by display_order
    sections.sort((a, b) => a.display_order - b.display_order);

    return sections.length > 0 ? sections : DEFAULT_LIVE_HOMEPAGE_SECTIONS;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("Failed to query homepage sections:", err);
    return DEFAULT_LIVE_HOMEPAGE_SECTIONS;
  }
}

/**
 * Cached homepage sections: revalidates every 5 minutes.
 * Bust with revalidateTag('homepage-sections') when admin saves homepage layout.
 */
const getCachedHomepageSections = unstable_cache(
  fetchHomepageSections,
  ["homepage-sections"],
  { tags: ["homepage-sections"], revalidate: 300 }
);

/**
 * Request-level deduplicated + cross-request cached homepage sections.
 */
export const getHomepageSections = cache(getCachedHomepageSections);
