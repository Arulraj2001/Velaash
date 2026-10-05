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

// Curated high-resolution fallback photography
const DEFAULT_IMAGES: Record<string, string> = {
  // Women fallbacks (rich, warm editorial tones)
  "kurtas-sets":
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85",
  dresses:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85",
  sarees:
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  "tops-shirts":
    "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=1200&q=85",
  women_fallback:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
  // Men fallbacks
  men: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85",
  "men-shirts":
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85",
  // Pooja fallbacks
  "pooja-and-brass":
    "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=900&q=85",
  pooja:
    "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=900&q=85",
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
        <Link
          href={womenHero ? `/collections/${womenHero.slug}` : "/collections/kurtas-sets"}
          className="group relative rounded-2xl overflow-hidden border border-brand-border/40 shadow-sm hover:shadow-luxury transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          style={{ minHeight: "480px" }}
        >
          <Image
            src={womenImage}
            alt="Women's Collection"
            fill
            priority
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/20 to-transparent group-hover:from-brand-dark/90 transition-all duration-300" />

          {/* Sub-category chips — top of card */}
          {womenSubs.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
              {womenSubs.map((sub) => (
                <span
                  key={sub.id}
                  className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-[10px] font-medium text-white tracking-wide"
                >
                  {sub.name}
                </span>
              ))}
            </div>
          )}

          {/* Content overlay — bottom */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end">
            <span className="text-brand-gold text-[10px] font-semibold tracking-widest uppercase mb-1">
              Women&apos;s Collection
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {womenHero?.name ?? "Kurtas & Sets"}
            </h3>
            <p className="text-white/70 text-xs sm:text-sm font-sans mt-1 max-w-xs line-clamp-2">
              {womenHero?.description ?? "Fluid silks, breathable mulmul cottons, and coordinating everyday sets."}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold group-hover:gap-2.5 transition-all duration-200">
              <span>Shop Women&apos;s</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* RIGHT: Men + Pooja stacked */}
        <div className="flex flex-col gap-4">
          {/* Men */}
          <Link
            href={menCategory ? `/collections/${menCategory.slug}` : "/collections/men"}
            className="group relative rounded-2xl overflow-hidden border border-brand-border/40 shadow-sm hover:shadow-luxury transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold flex-1"
            style={{ minHeight: "228px" }}
          >
            <Image
              src={menImage}
              alt="Men's Collection"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/25 to-transparent group-hover:from-brand-dark/90 transition-all duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <span className="text-brand-gold text-[10px] font-semibold tracking-widest uppercase mb-0.5 block">
                Men&apos;s Collection
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-white tracking-tight">
                {menCategory?.name ?? "Men's Wear"}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-gold group-hover:gap-2.5 transition-all duration-200">
                <span>Shop Men&apos;s</span>
                <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Pooja & Brass */}
          <Link
            href={poojaCategory ? `/collections/${poojaCategory.slug}` : "/collections/pooja-and-brass"}
            className="group relative rounded-2xl overflow-hidden border border-brand-border/40 shadow-sm hover:shadow-luxury transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold flex-1"
            style={{ minHeight: "228px" }}
          >
            <Image
              src={poojaImage}
              alt="Pooja & Brass Collection"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            {/* Warmer overlay for the sacred category */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/85 via-brand-dark/25 to-transparent group-hover:from-amber-950/90 transition-all duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <span className="text-amber-300 text-[10px] font-semibold tracking-widest uppercase mb-0.5 block">
                Sacred Essentials
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-white tracking-tight">
                {poojaCategory?.name ?? "Pooja & Brass"}
              </h3>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 group-hover:gap-2.5 transition-all duration-200">
                <span>Shop Sacred Wear</span>
                <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
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
