import type { NavigationCategory, NavigationSubCategory } from "../types";
import type { ShippingPolicySetting } from "@/features/settings/types";

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
  isSpecial?: boolean;
  dropdownType: "mega-women" | "dropdown-men" | "dropdown-pooja" | "dropdown-festive" | "none";
  sections?: NavSection[];
  featuredCard?: NavCard;
}

/**
 * Transforms flat raw categories into the 3-pillar brand architecture:
 * 1. WOMEN (Multi-column mega-menu containing Kurtas, Dresses, Co-ords, Tops, Bottoms, Loungewear)
 * 2. MEN (Shirts, Kurtas, T-Shirts, Bottoms)
 * 3. POOJA & BRASS ITEMS (Lamps & Diyas, Pooja Accessories, Brassware)
 * 4. FESTIVE OFFERS (Highlighted campaign pill with coupon/free delivery callout)
 * 5. ALL COLLECTIONS (Direct shop link)
 */
export function groupNavigationCategories(
  categories: NavigationCategory[],
  shippingPolicy?: ShippingPolicySetting
): NavPillar[] {
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
      imageUrl:
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
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
      imageUrl:
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
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
      imageUrl:
        "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=600&q=80",
      href: "/collections/pooja-and-brass",
      ctaText: "Discover Pooja Items",
    },
  };

  // --- PILLAR 4: FESTIVE OFFERS (Highlighted Pill) ---
  const isFestiveActive = Boolean(shippingPolicy?.festive_shipping_enabled);
  const campaignName = shippingPolicy?.festive_campaign_name || "Festive Offers";
  const couponCode = shippingPolicy?.festive_coupon_code || "PONGALFREE";

  const festivePillar: NavPillar = {
    id: "nav-festive",
    name: isFestiveActive ? campaignName : "Festive Offers",
    href: "/shop",
    badge: isFestiveActive ? "FREE SHIPPING" : "SPECIAL",
    isSpecial: true,
    dropdownType: "dropdown-festive",
    sections: [
      {
        title: "Seasonal Celebrations",
        href: "/shop",
        items: [
          {
            id: "festive-kurtas",
            name: "Festive Kurtas & Sets",
            slug: "kurtas-sets",
            href: "/collections/kurtas-sets",
            description: "Handcrafted festive ensembles with rich jewel tones",
          },
          {
            id: "festive-diyas",
            name: "Traditional Brass Deepams",
            slug: "lamps-diyas",
            href: "/collections/lamps-diyas",
            description: "Auspicious brass lamps and kuthuvilakku for celebrations",
          },
          {
            id: "festive-men",
            name: "Men's Festive Kurtas",
            slug: "men-kurtas",
            href: "/collections/men-kurtas",
            description: "Refined mandarin collar kurtas in pure cotton and linen",
          },
        ],
      },
    ],
    featuredCard: {
      title: isFestiveActive ? `${campaignName} Active` : "Complimentary Delivery",
      subtitle: isFestiveActive
        ? `Use code ${couponCode} for ₹0 delivery on festive orders.`
        : "Enjoy complimentary shipping on all orders above ₹1,999.",
      imageUrl:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      href: "/shop",
      ctaText: "Shop Festive Capsule",
    },
  };

  // --- PILLAR 5: ALL PRODUCTS ---
  const allProductsPillar: NavPillar = {
    id: "nav-all",
    name: "All Products",
    href: "/shop",
    dropdownType: "none",
  };

  return [womenPillar, menPillar, poojaPillar, festivePillar, allProductsPillar];
}
