"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Shirt, Flame } from "lucide-react";
import type { NavigationCategory } from "@/features/navigation/types";

interface CategoryPillarTabsProps {
  categories: NavigationCategory[];
  title?: string;
  subtitle?: string;
}

interface PillarItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description?: string;
}

interface PillarTab {
  id: "women" | "men" | "pooja";
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  viewAllHref: string;
  viewAllText: string;
  items: PillarItem[];
  gridColsClass: string;
}

// Curated high-resolution fallback photography for all brand categories
const DEFAULT_IMAGES: Record<string, string> = {
  // Women
  "kurtas-sets": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
  dresses: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
  sarees: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  "coord-sets": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  "tops-shirts": "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80",
  bottoms: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80",
  loungewear: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?auto=format&fit=crop&w=800&q=80",

  // Men
  "men-shirts": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
  "men-kurtas": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
  "men-t-shirts": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
  "men-bottoms": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",

  // Pooja & Brassware
  "lamps-diyas": "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=800&q=80",
  "pooja-accessories": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
  "brass-urli-decor": "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
};

export function CategoryPillarTabs({
  categories,
  title = "Explore by Collection",
  subtitle = "Thoughtfully curated across our signature women's silhouettes, men's essentials, and sacred brassware.",
}: CategoryPillarTabsProps) {
  const [activeTab, setActiveTab] = useState<"women" | "men" | "pooja">("women");

  // 1. Separate raw categories into Women, Men, and Pooja
  const menCategory = categories.find(
    (c) => c.slug === "men" || c.name.toLowerCase() === "men"
  );
  const poojaCategory = categories.find(
    (c) =>
      c.slug === "pooja-and-brass" ||
      c.slug.includes("pooja") ||
      c.name.toLowerCase().includes("pooja") ||
      c.name.toLowerCase().includes("brass")
  );
  const womenCategories = categories.filter(
    (c) => c.id !== menCategory?.id && c.id !== poojaCategory?.id
  );

  // 2. Build Women's items (6 categories)
  const womenItems: PillarItem[] = womenCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.image_url || DEFAULT_IMAGES[c.slug] || DEFAULT_IMAGES["kurtas-sets"],
    description: c.description || undefined,
  }));

  // 3. Build Men's items (from subcategories or fallback structured menswear)
  const menSubcategories = menCategory?.subcategories || [];
  const menItems: PillarItem[] =
    menSubcategories.length >= 4
      ? menSubcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          imageUrl: sub.image_url || DEFAULT_IMAGES[sub.slug] || DEFAULT_IMAGES["men-shirts"],
          description: sub.description || undefined,
        }))
      : [
          {
            id: "men-sub-1",
            name: "Tailored Shirts",
            slug: "men-shirts",
            imageUrl: DEFAULT_IMAGES["men-shirts"],
            description: "Pure cotton and linen casual shirts",
          },
          {
            id: "men-sub-2",
            name: "Festive Kurtas",
            slug: "men-kurtas",
            imageUrl: DEFAULT_IMAGES["men-kurtas"],
            description: "Short and classic festive kurtas",
          },
          {
            id: "men-sub-3",
            name: "Everyday T-Shirts",
            slug: "men-t-shirts",
            imageUrl: DEFAULT_IMAGES["men-t-shirts"],
            description: "Combed cotton polos and crew necks",
          },
          {
            id: "men-sub-4",
            name: "Linen Bottoms",
            slug: "men-bottoms",
            imageUrl: DEFAULT_IMAGES["men-bottoms"],
            description: "Breathable trousers and relaxed pants",
          },
        ];

  // 4. Build Pooja & Brass items
  const poojaSubcategories = poojaCategory?.subcategories || [];
  const poojaItems: PillarItem[] =
    poojaSubcategories.length >= 3
      ? poojaSubcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          imageUrl: sub.image_url || DEFAULT_IMAGES[sub.slug] || DEFAULT_IMAGES["lamps-diyas"],
          description: sub.description || undefined,
        }))
      : [
          {
            id: "pooja-sub-1",
            name: "Lamps & Diyas",
            slug: "lamps-diyas",
            imageUrl: DEFAULT_IMAGES["lamps-diyas"],
            description: "Traditional kuthuvilakku & oil lamps",
          },
          {
            id: "pooja-sub-2",
            name: "Pooja Accessories",
            slug: "pooja-accessories",
            imageUrl: DEFAULT_IMAGES["pooja-accessories"],
            description: "Sacred aarti trays, bells & essentials",
          },
          {
            id: "pooja-sub-3",
            name: "Handcrafted Brassware",
            slug: "pooja-and-brass",
            imageUrl: DEFAULT_IMAGES["brass-urli-decor"],
            description: "Traditional brass urli & decor",
          },
        ];

  // 5. Pillar Configurations
  const pillars: Record<"women" | "men" | "pooja", PillarTab> = {
    women: {
      id: "women",
      label: "Women's Collection",
      badge: "6 Silhouettes",
      icon: Sparkles,
      tagline: "Fluid silks, breathable mulmul cottons, and coordinating everyday sets.",
      viewAllHref: "/collections/kurtas-sets",
      viewAllText: "Explore Full Women's Wear",
      items: womenItems,
      gridColsClass: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4",
    },
    men: {
      id: "men",
      label: "Men's Collection",
      badge: "4 Essentials",
      icon: Shirt,
      tagline: "Handcrafted linen, tailored casual shirts, and festive cotton kurtas for men.",
      viewAllHref: "/collections/men",
      viewAllText: "Explore Full Men's Wear",
      items: menItems,
      gridColsClass: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 max-w-5xl mx-auto",
    },
    pooja: {
      id: "pooja",
      label: "Pooja & Brass Items",
      badge: "Sacred Essentials",
      icon: Flame,
      tagline: "Auspicious brass kuthuvilakku, table lamps, and traditional pooja accessories.",
      viewAllHref: "/collections/pooja-and-brass",
      viewAllText: "Explore Full Brass Collection",
      items: poojaItems,
      gridColsClass: "grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto",
    },
  };

  const currentPillar = pillars[activeTab];

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="max-w-2xl mx-auto text-center space-y-2">
        <span className="text-brand-accent-dark text-xs font-semibold tracking-widest uppercase">
          Curated Brand Pillars
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
          {title}
        </h2>
        <p className="text-brand-muted text-xs sm:text-sm font-sans">{subtitle}</p>
      </div>

      {/* Luxury Pillar Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-brand-cream-dark/60 border border-brand-border/70 shadow-xs">
          {(["women", "men", "pooja"] as const).map((tabId) => {
            const tab = pillars[tabId];
            const Icon = tab.icon;
            const isActive = activeTab === tabId;

            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={`relative inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                  isActive
                    ? "bg-brand-dark text-brand-cream shadow-md scale-[1.02]"
                    : "text-brand-muted hover:text-brand-dark hover:bg-white/70"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? "text-brand-gold" : "text-brand-muted"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Descriptive Subhead */}
      <div className="text-center">
        <p className="text-xs sm:text-sm text-brand-muted italic max-w-xl mx-auto">
          &ldquo;{currentPillar.tagline}&rdquo;
        </p>
      </div>

      {/* Pillar Cards Grid (Each tab renders a perfectly balanced, 100% filled grid) */}
      <div className={currentPillar.gridColsClass}>
        {currentPillar.items.map((item) => (
          <Link
            key={item.id}
            href={`/collections/${item.slug}`}
            className="group relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-xs hover:shadow-luxury transition-all duration-300 border border-brand-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              sizes={
                activeTab === "women"
                  ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  : activeTab === "men"
                    ? "(max-width: 640px) 50vw, 25vw"
                    : "(max-width: 640px) 100vw, 33vw"
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/25 to-transparent transition-opacity duration-300 group-hover:from-brand-dark/95" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col justify-end text-left">
              <h3 className="font-heading text-sm sm:text-base font-semibold text-white tracking-tight line-clamp-1">
                {item.name}
              </h3>
              {item.description && (
                <p className="hidden sm:block text-[11px] text-white/70 line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-brand-gold group-hover:text-brand-gold/90 transition-colors">
                <span>Explore</span>
                <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Action Link */}
      <div className="pt-2 text-center">
        <Link
          href={currentPillar.viewAllHref}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-brand-accent transition-colors pb-0.5 border-b border-brand-dark/30 hover:border-brand-accent"
        >
          <span>{currentPillar.viewAllText}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
