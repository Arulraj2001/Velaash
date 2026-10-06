import type { NavigationCategory } from "../types";

export interface NavSectionItem {
  id: string;
  name: string;
  slug: string;
  href: string;
  description?: string | null;
}

export interface NavSection {
  title: string;
  href?: string;
  items: NavSectionItem[];
}

export interface NavCard {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  ctaText: string;
}

export interface NavPillar {
  id: string;
  name: string;
  href: string;
  badge?: string;
  dropdownType: "mega-women" | "dropdown-men" | "dropdown-pooja" | "none";
  sections?: NavSection[];
  featuredCard?: NavCard;
}

/**
 * Transforms flat raw categories into the 4-pillar brand architecture:
 * 1. WOMEN (Multi-column mega-menu containing Kurtas, Dresses, Co-ords, Tops, Bottoms, Loungewear)
 * 2. MEN (Shirts, Kurtas, T-Shirts, Bottoms)
 * 3. POOJA & BRASS ITEMS (Lamps & Diyas, Pooja Accessories, Brassware)
 * 4. ALL PRODUCTS (Direct shop link)
 */
export function groupNavigationCategories(
  categories: NavigationCategory[],
  policy?: unknown
): NavPillar[] {
  void policy;
  // 1. Separate Men, Pooja, and Women categories
  const menCat = categories.find((c) => c.slug === "men" || c.name.toLowerCase() === "men");
  const poojaCat = categories.find(
    (c) =>
      c.slug === "pooja-and-brass" ||
      c.slug.includes("pooja") ||
      c.name.toLowerCase().includes("pooja") ||
      c.name.toLowerCase().includes("brass")
  );

  const womenCategories = categories.filter(
    (c) => c.id !== menCat?.id && c.id !== poojaCat?.id
  );

  // --- PILLAR 1: WOMEN ---
  // Group women's categories into 3 structured columns
  const kurtasAndCoords = womenCategories.filter((c) =>
    ["kurtas-sets", "coord-sets", "co-ord-sets"].includes(c.slug)
  );
  const dressesAndTops = womenCategories.filter((c) =>
    ["dresses", "tops-shirts", "tops-tunics"].includes(c.slug)
  );
  const bottomsAndLounge = womenCategories.filter((c) =>
    ["bottoms", "pants-trousers", "loungewear"].includes(c.slug)
  );

  // Catch any unclassified women categories
  const otherWomen = womenCategories.filter(
    (c) =>
      !kurtasAndCoords.some((k) => k.id === c.id) &&
      !dressesAndTops.some((d) => d.id === c.id) &&
      !bottomsAndLounge.some((b) => b.id === c.id)
  );

  const womenSections: NavSection[] = [];

  const mapCategoryToSection = (cat: NavigationCategory): NavSection => ({
    title: cat.name,
    href: `/collections/${cat.slug}`,
    items: (cat.subcategories || []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      href: `/collections/${sub.slug}`,
      description: sub.description,
    })),
  });

  // Group 1: Indian & Festive
  kurtasAndCoords.forEach((cat) => womenSections.push(mapCategoryToSection(cat)));
  // Group 2: Contemporary & Everyday
  dressesAndTops.forEach((cat) => womenSections.push(mapCategoryToSection(cat)));
  // Group 3: Bottoms & Lounge
  bottomsAndLounge.forEach((cat) => womenSections.push(mapCategoryToSection(cat)));
  // Group 4: Others (if any added in future)
  otherWomen.forEach((cat) => womenSections.push(mapCategoryToSection(cat)));

  const womenPillar: NavPillar = {
    id: "nav-women",
    name: "Women",
    href: "/collections/kurtas-sets",
    dropdownType: "mega-women",
    sections: womenSections,
    featuredCard: {
      title: "Handcrafted Women's Wear",
      subtitle: "Fluid silhouettes in pure cottons, festive jewel tones, and coordinated sets.",
      imageUrl: womenCategories[0]?.image_url || "/categories/kurtas-sets.jpg",
      href: "/collections/kurtas-sets",
      ctaText: "Explore Women's Wear",
    },
  };

  // --- PILLAR 2: MEN ---
  const menSubcategories = menCat?.subcategories || [
    {
      id: "sub-men-shirts",
      name: "Shirts",
      slug: "men-shirts",
      description: "Casual, formal, and resort shirts in pure linen and cotton",
      image_url: null,
      display_order: 1,
    },
    {
      id: "sub-men-kurtas",
      name: "Kurtas",
      slug: "men-kurtas",
      description: "Short and classic festive kurtas with mandarin collars",
      image_url: null,
      display_order: 2,
    },
    {
      id: "sub-men-t-shirts",
      name: "T-Shirts",
      slug: "men-t-shirts",
      description: "Everyday crew necks and polo tees in combed cotton",
      image_url: null,
      display_order: 3,
    },
    {
      id: "sub-men-bottoms",
      name: "Bottoms & Trousers",
      slug: "men-bottoms",
      description: "Relaxed drawstring trousers and easy linen pants",
      image_url: null,
      display_order: 4,
    },
  ];

  const menPillar: NavPillar = {
    id: "nav-men",
    name: "Men",
    href: "/collections/men",
    dropdownType: "dropdown-men",
    sections: [
      {
        title: "Men's Apparel",
        href: "/collections/men",
        items: menSubcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          href: `/collections/${sub.slug}`,
          description: sub.description,
        })),
      },
    ],
    featuredCard: {
      title: "Natural Fabrics for Men",
      subtitle: "Tailored in breathable linen and handloom cotton for timeless everyday poise.",
      imageUrl: menCat?.image_url || "/categories/men.jpg",
      href: "/collections/men",
      ctaText: "Explore Men's Wear",
    },
  };

  // --- PILLAR 3: POOJA & BRASS ITEMS ---
  const poojaSubcategories = poojaCat?.subcategories || [
    {
      id: "sub-lamps-diyas",
      name: "Lamps & Diyas",
      slug: "lamps-diyas",
      description: "Traditional kuthuvilakku, brass lamps, and handcrafted oil diyas",
      image_url: null,
      display_order: 1,
    },
    {
      id: "sub-pooja-accessories",
      name: "Pooja Accessories",
      slug: "pooja-accessories",
      description: "Bells, brass aarti trays, and sacred pooja essentials",
      image_url: null,
      display_order: 2,
    },
  ];

  const poojaPillar: NavPillar = {
    id: "nav-pooja",
    name: "Pooja & Brass",
    href: "/collections/pooja-and-brass",
    dropdownType: "dropdown-pooja",
    sections: [
      {
        title: "Sacred Brass Essentials",
        href: "/collections/pooja-and-brass",
        items: poojaSubcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          href: `/collections/${sub.slug}`,
          description: sub.description,
        })),
      },
    ],
    featuredCard: {
      title: "Sacred Living & Brassware",
      subtitle: "Traditional deepams, handcrafted kuthuvilakku, and sacred essentials for your sanctuary.",
      imageUrl: poojaCat?.image_url || "/categories/pooja-and-brass.jpg",
      href: "/collections/pooja-and-brass",
      ctaText: "Discover Pooja Items",
    },
  };

  // --- PILLAR 4: ALL PRODUCTS ---
  const allProductsPillar: NavPillar = {
    id: "nav-all",
    name: "All Products",
    href: "/shop",
    dropdownType: "none",
  };

  return [womenPillar, menPillar, poojaPillar, allProductsPillar];
}
