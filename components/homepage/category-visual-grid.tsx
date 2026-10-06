import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NavigationCategory } from "@/features/navigation/types";

interface CategoryVisualGridProps {
  categories: NavigationCategory[];
  title?: string;
  subtitle?: string;
}

// Curated South Indian heritage static photography fallbacks
const DEFAULT_IMAGES: Record<string, string> = {
  // Women fallbacks
  "kurtas-sets": "/categories/kurtas-sets.jpg",
  dresses: "/categories/dresses.jpg",
  sarees: "/categories/sarees.jpg",
  "tops-shirts": "/categories/tops-shirts.jpg",
  bottoms: "/categories/bottoms.jpg",
  loungewear: "/categories/loungewear.jpg",
  women_fallback: "/categories/kurtas-sets.jpg",
  // Men fallbacks
  men: "/categories/men.jpg",
  "men-kurtas": "/categories/men-kurtas.jpg",
  "men-t-shirts": "/categories/men-t-shirts.jpg",
  "men-bottoms": "/categories/men-bottoms.jpg",
  "men-shirts": "/categories/men-kurtas.jpg",
  // Pooja & Brass fallbacks
  "pooja-and-brass": "/categories/pooja-and-brass.jpg",
  "lamps-diyas": "/categories/lamps-diyas.jpg",
  "pooja-accessories": "/categories/pooja-accessories.jpg",
  pooja: "/categories/pooja-and-brass.jpg",
};

function getImageUrl(
  category: NavigationCategory,
  fallbackKey: string
): string {
  return (
    category.image_url ||
    DEFAULT_IMAGES[category.slug] ||
    DEFAULT_IMAGES[fallbackKey] ||
    DEFAULT_IMAGES.women_fallback
  );
}

export function CategoryVisualGrid({
  categories,
  title = "Explore by Collection",
  subtitle = "Thoughtfully curated across women's silhouettes, men's essentials, and sacred brassware.",
}: CategoryVisualGridProps) {
  // Split into Women / Men / Pooja pillars
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
  // All remaining = Women
  const womenCategories = categories.filter(
    (c) => c.id !== menCategory?.id && c.id !== poojaCategory?.id
  );

  // Women: pick the hero-worthy primary category (first top-level or most prominent)
  const womenHero = womenCategories[0];
  // Pick up to 3 additional women sub-categories to show as small chips
  const womenSubs = womenCategories.slice(1, 4);

  // Men hero image
  const menImage = getImageUrl(
    menCategory ?? { id: "men", name: "Men", slug: "men", image_url: null, subcategories: [], description: null, display_order: 999 },
    "men"
  );

  // Pooja hero image
  const poojaImage = getImageUrl(
    poojaCategory ?? { id: "pooja", name: "Pooja & Brass", slug: "pooja-and-brass", image_url: null, subcategories: [], description: null, display_order: 999 },
    "pooja-and-brass"
  );

  // Women hero image
  const womenImage = womenHero
    ? getImageUrl(womenHero, "women_fallback")
    : DEFAULT_IMAGES.women_fallback;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="max-w-2xl mx-auto text-center space-y-2">
        <span className="text-brand-accent-dark text-xs font-semibold tracking-widest uppercase">
          Shop by Category
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
          {title}
        </h2>
        <p className="text-brand-muted text-xs sm:text-sm font-sans">{subtitle}</p>
      </div>

      {/*
        Asymmetric Grid Layout:
        ┌──────────────────┬──────────┐
        │                  │   Men    │
        │     Women        ├──────────┤
        │   (tall hero)    │  Pooja   │
        └──────────────────┴──────────┘
      */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px] gap-4">
        {/* LEFT: Women — large hero panel */}
        <div
          className="group relative rounded-2xl overflow-hidden border border-brand-border/60 shadow-xs hover:shadow-gold-md hover:border-brand-gold/70 transition-all duration-500 focus-within:ring-2 focus-within:ring-brand-gold"
          style={{ minHeight: "480px" }}
        >
          <Link
            href="/collections/women"
            className="absolute inset-0 z-0"
            aria-label="Explore Women's Collection"
          >
            <Image
              src={womenImage}
              alt="Women's Collection"
              fill
              quality={72}
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
              sizes="(max-width: 768px) calc(100vw - 2rem), 60vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/30 to-black/20 group-hover:from-brand-dark transition-all duration-300" />
          </Link>

          {/* Sub-category chips — top of card */}
          {womenSubs.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10 pointer-events-auto">
              {womenSubs.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/collections/${sub.slug}`}
                  className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-[10px] font-semibold text-white tracking-wide hover:bg-brand-gold hover:text-brand-dark hover:border-brand-gold transition-all duration-200"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {/* Content overlay — bottom */}
          <Link
            href="/collections/women"
            className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end z-10 pointer-events-auto"
          >
            <span className="text-brand-gold text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase mb-1">
              Women&apos;s Collection
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
              Handcrafted Silhouettes
            </h3>
            <p className="text-white/80 text-xs sm:text-sm font-sans mt-1 max-w-sm line-clamp-2">
              Fluid sarees, pure mulmul cotton kurtas, and breezy everyday coordinates.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-light group-hover:text-brand-gold transition-colors">
              <span>Explore Women&apos;s Wear</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </div>
          </Link>
        </div>

        {/* RIGHT: Men + Pooja stacked */}
        <div className="flex flex-col gap-4">
          {/* Men */}
          <Link
            href={menCategory ? `/collections/${menCategory.slug}` : "/collections/men"}
            className="group relative rounded-2xl overflow-hidden border border-brand-border/60 shadow-xs hover:shadow-gold-md hover:border-brand-gold/70 transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold flex-1"
            style={{ minHeight: "228px" }}
          >
            <Image
              src={menImage}
              alt="Men's Collection"
              fill
              quality={72}
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/35 to-black/20 group-hover:from-brand-dark transition-all duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10">
              <span className="text-brand-gold text-[10px] font-semibold tracking-widest uppercase mb-0.5 block">
                Men&apos;s Collection
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-white tracking-tight">
                {menCategory?.name ?? "Men's Wear"}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-light group-hover:text-brand-gold transition-colors">
                <span>Explore Men&apos;s Wear</span>
                <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </div>
          </Link>

          {/* Pooja & Brass */}
          <Link
            href={poojaCategory ? `/collections/${poojaCategory.slug}` : "/collections/pooja-and-brass"}
            className="group relative rounded-2xl overflow-hidden border border-brand-border/60 shadow-xs hover:shadow-gold-md hover:border-brand-gold/70 transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold flex-1"
            style={{ minHeight: "228px" }}
          >
            <Image
              src={poojaImage}
              alt="Pooja & Brass Collection"
              fill
              quality={72}
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            {/* Warmer overlay for sacred brass */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/95 via-brand-dark/35 to-black/20 group-hover:from-amber-950 transition-all duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10">
              <span className="text-amber-300 text-[10px] font-semibold tracking-widest uppercase mb-0.5 block">
                Sacred Living
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-white tracking-tight">
                {poojaCategory?.name ?? "Pooja & Brass"}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-200 group-hover:text-amber-300 transition-colors">
                <span>Discover Brassware</span>
                <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile: View all sub-categories as horizontal scroll chips */}
      {womenCategories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar md:hidden">
          {womenCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full border border-brand-border/60 bg-white text-brand-dark text-xs font-medium hover:bg-brand-cream/60 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
