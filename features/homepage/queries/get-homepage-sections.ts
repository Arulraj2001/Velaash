import { createClient } from "@/lib/supabase/server";
import type { LiveHomepageSection } from "../types";
import type { HomepageSectionKind } from "@/features/admin/types/homepage";

export const DEFAULT_LIVE_HOMEPAGE_SECTIONS: LiveHomepageSection[] = [
  {
    id: "default-hero",
    section_type: "hero_banner",
    title: "Modern Everyday Luxury",
    display_order: 1,
    is_active: true,
    content: {
      headline: "Modern Everyday Luxury",
      subtitle:
        "Effortless silhouettes, refined textures, and contemporary wardrobe essentials designed for everyday elegance.",
      cta_text: "Explore Collection",
      cta_link: "/shop",
      secondary_cta_text: "Kurtas & Sets",
      secondary_cta_link: "/collections/kurtas-sets",
      bg_image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
    },
  },
  {
    id: "default-category-grid",
    section_type: "category_grid",
    title: "Explore by Category",
    display_order: 2,
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
    title: "Patron Stories",
    display_order: 5,
    is_active: true,
    content: {
      headline: "Cherished by Our Patrons",
      subtitle: "Real experiences from women who celebrate everyday grace in our tailored silhouettes.",
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
          description: "Direct assistance and sizing guidance on +91 8508643832.",
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
 * Server query function to fetch active homepage sections from the homepage_sections table.
 * Sorted strictly by display_order ascending.
 * Respects is_active = true.
 */
export async function getHomepageSections(): Promise<LiveHomepageSection[]> {
  try {
    const supabase = await createClient();

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

      const content =
        row.content && typeof row.content === "object" && !Array.isArray(row.content)
          ? (row.content as Record<string, unknown>)
          : {};

      sections.push({
        id: row.id,
        section_type,
        title: row.title,
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
