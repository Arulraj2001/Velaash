import { createClient } from "@/lib/supabase/server";
import type { NavigationCategory, NavigationSubCategory } from "../types";

/**
 * Curated general clothing boutique category tree fallback
 * Used when the database has not yet been seeded or during local/offline preview.
 */
export const DEFAULT_CLOTHING_CATEGORIES: NavigationCategory[] = [
  {
    id: "cat-kurtas",
    name: "Kurtas & Sets",
    slug: "kurtas-sets",
    description: "Everyday and festive kurtas crafted from handpicked cottons and silks",
    image_url:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
    display_order: 1,
    subcategories: [
      {
        id: "sub-straight-kurtas",
        name: "Straight Kurtas",
        slug: "straight-kurtas",
        description: "Classic straight-cut silhouettes for effortless elegance",
        image_url: null,
        display_order: 1,
      },
      {
        id: "sub-anarkali-sets",
        name: "Anarkali & Flared Sets",
        slug: "anarkali-flared-sets",
        description: "Graceful flowing flares with coordinated dupattas",
        image_url: null,
        display_order: 2,
      },
      {
        id: "sub-a-line",
        name: "A-Line Kurtas",
        slug: "a-line-kurtas",
        description: "Contemporary cuts for work and casual outings",
        image_url: null,
        display_order: 3,
      },
      {
        id: "sub-short-kurtis",
        name: "Short Kurtis & Tunics",
        slug: "short-kurtis-tunics",
        description: "Versatile pairings for denims and trousers",
        image_url: null,
        display_order: 4,
      },
    ],
  },
  {
    id: "cat-dresses",
    name: "Dresses",
    slug: "dresses",
    description: "Refined midi, maxi, and shift dresses for relaxed sophistication",
    image_url:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
    display_order: 2,
    subcategories: [
      {
        id: "sub-midi-dresses",
        name: "Midi Dresses",
        slug: "midi-dresses",
        description: "Flattering lengths tailored in breathable weaves",
        image_url: null,
        display_order: 1,
      },
      {
        id: "sub-maxi-dresses",
        name: "Maxi Dresses",
        slug: "maxi-dresses",
        description: "Sweeping hemlines with understated elegance",
        image_url: null,
        display_order: 2,
      },
      {
        id: "sub-wrap-dresses",
        name: "Wrap & Tiered Dresses",
        slug: "wrap-tiered-dresses",
        description: "Dynamic silhouettes with flattering cinch ties",
        image_url: null,
        display_order: 3,
      },
    ],
  },
  {
    id: "cat-coord-sets",
    name: "Co-ord Sets",
    slug: "coord-sets",
    description: "Effortlessly paired top and bottom ensembles for elevated simplicity",
    image_url:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    display_order: 3,
    subcategories: [
      {
        id: "sub-linen-coords",
        name: "Pure Linen Sets",
        slug: "linen-coord-sets",
        description: "Cool, breathable luxury for warm summer afternoons",
        image_url: null,
        display_order: 1,
      },
      {
        id: "sub-printed-coords",
        name: "Artisanal Printed Sets",
        slug: "printed-coord-sets",
        description: "Hand-block and contemporary geometric prints",
        image_url: null,
        display_order: 2,
      },
      {
        id: "sub-festive-coords",
        name: "Occasion & Festive Co-ords",
        slug: "festive-coord-sets",
        description: "Subtle zari and hand-embroidered evening coordinates",
        image_url: null,
        display_order: 3,
      },
    ],
  },
  {
    id: "cat-tops-shirts",
    name: "Tops & Shirts",
    slug: "tops-shirts",
    description: "Crisp shirts, breezy tunics, and delicately detailed blouses",
    image_url:
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80",
    display_order: 4,
    subcategories: [
      {
        id: "sub-formal-shirts",
        name: "Tailored Shirts",
        slug: "tailored-shirts",
        description: "Sharp collars and relaxed fits in cotton and poplin",
        image_url: null,
        display_order: 1,
      },
      {
        id: "sub-blouses",
        name: "Embroidered Tops",
        slug: "embroidered-tops",
        description: "Delicate necklines and handcrafted sleeve motifs",
        image_url: null,
        display_order: 2,
      },
      {
        id: "sub-peplum-tops",
        name: "Peplum & Flared Tops",
        slug: "peplum-flared-tops",
        description: "Modern cinched silhouettes for relaxed days",
        image_url: null,
        display_order: 3,
      },
    ],
  },
  {
    id: "cat-bottoms",
    name: "Bottoms",
    slug: "bottoms",
    description: "Comfortable trousers, flowing palazzos, and versatile culottes",
    image_url:
      "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80",
    display_order: 5,
    subcategories: [
      {
        id: "sub-pants-trousers",
        name: "Pants & Trousers",
        slug: "pants-trousers",
        description: "Structured fits with comfortable elasticated waists",
        image_url: null,
        display_order: 1,
      },
      {
        id: "sub-palazzos",
        name: "Palazzos & Culottes",
        slug: "palazzos-culottes",
        description: "Wide-leg volume crafted in lightweight cottons",
        image_url: null,
        display_order: 2,
      },
      {
        id: "sub-skirts",
        name: "Skirts",
        slug: "skirts",
        description: "Flared and pleated statement skirts",
        image_url: null,
        display_order: 3,
      },
    ],
  },
  {
    id: "cat-loungewear",
    name: "Loungewear",
    slug: "loungewear",
    description: "Soft mulmul and modal separates designed for tranquil moments",
    image_url:
      "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?auto=format&fit=crop&w=600&q=80",
    display_order: 6,
    subcategories: [
      {
        id: "sub-sleepwear",
        name: "Lounge Sets",
        slug: "lounge-sets",
        description: "Matching notch-collar sets in breathable cotton",
        image_url: null,
        display_order: 1,
      },
      {
        id: "sub-kaftans",
        name: "Kaftans & Robes",
        slug: "kaftans-robes",
        description: "Airy silhouettes for serene comfort at home",
        image_url: null,
        display_order: 2,
      },
    ],
  },
];

/**
 * Server-side query function to fetch active top-level categories
 * and their nested sub-categories, ordered by display_order.
 * Shared between Header and Footer.
 */
export async function getNavigationCategories(): Promise<NavigationCategory[]> {
  try {
    const supabase = await createClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, display_order, is_active, parent_id")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !categories || categories.length === 0) {
      return DEFAULT_CLOTHING_CATEGORIES;
    }

    // Partition into parents and children
    const topLevel = categories.filter((c) => !c.parent_id);
    const subCategories = categories.filter((c) => Boolean(c.parent_id));

    if (topLevel.length === 0) {
      return DEFAULT_CLOTHING_CATEGORIES;
    }

    // Map sub-categories to their parent category
    const result: NavigationCategory[] = topLevel.map((parent) => {
      const children: NavigationSubCategory[] = subCategories
        .filter((child) => child.parent_id === parent.id)
        .map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          image_url: child.image_url,
          display_order: child.display_order,
        }));

      return {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        image_url: parent.image_url,
        display_order: parent.display_order,
        subcategories: children,
      };
    });

    return result;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    // Fall back smoothly to default clothing categories
    return DEFAULT_CLOTHING_CATEGORIES;
  }
}
