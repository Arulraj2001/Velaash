"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight } from "lucide-react";
import type { NavigationCategory } from "@/features/navigation";
import type { ShippingPolicySetting } from "@/features/settings";
import { groupNavigationCategories } from "@/features/navigation/utils/group-navigation";

interface HeaderNavProps {
  categories: NavigationCategory[];
  shippingPolicy?: ShippingPolicySetting;
}

export function HeaderNav({ categories }: HeaderNavProps) {
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const pillars = React.useMemo(
    () => groupNavigationCategories(categories),
    [categories]
  );

  const handleMouseEnter = (pillarId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(pillarId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav aria-label="Main Store Navigation" className="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">
      {pillars.map((pillar) => {
        const hasDropdown = pillar.dropdownType !== "none";
        const isOpen = activeDropdown === pillar.id;

        return (
          <div
            key={pillar.id}
            className="relative"
            onMouseEnter={() => hasDropdown && handleMouseEnter(pillar.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-1 py-4">
              <Link
                href={pillar.href}
                className="text-brand-dark/90 hover:text-brand-accent after:bg-brand-gold relative py-1 text-xs font-semibold tracking-widest uppercase transition-colors duration-150 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:transition-all hover:after:w-full"
                onFocus={() => hasDropdown && setActiveDropdown(pillar.id)}
              >
                {pillar.name}
              </Link>
              {hasDropdown && (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`${pillar.name} submenu`}
                  className="text-brand-muted hover:text-brand-accent rounded p-0.5"
                  onClick={() => setActiveDropdown(isOpen ? null : pillar.id)}
                >
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      isOpen ? "text-brand-accent rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {/* 1. Mega-Menu for WOMEN */}
            {pillar.dropdownType === "mega-women" && isOpen && (
              <div
                className="border-brand-border/70 bg-white/98 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 absolute top-full -left-20 z-50 w-[720px] rounded-2xl border p-6 font-sans backdrop-blur-md"
                onMouseEnter={() => handleMouseEnter(pillar.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-4 gap-6">
                  {/* Category Columns */}
                  <div className="col-span-3 grid grid-cols-3 gap-6 border-r border-slate-100 pr-6">
                    {(pillar.columns || [pillar.sections || []]).map((columnSections, colIdx) => (
                      <div key={colIdx} className="space-y-4">
                        {columnSections.map((section) => {
                          const hasItems = section.items && section.items.length > 0;
                          return (
                            <div
                              key={section.title}
                              className={
                                hasItems
                                  ? "space-y-2.5"
                                  : "rounded-xl border border-transparent p-2.5 hover:border-brand-border/60 hover:bg-brand-cream/50 transition-all group/item"
                              }
                            >
                              <Link
                                href={section.href || pillar.href}
                                onClick={() => setActiveDropdown(null)}
                                className={`flex items-center justify-between text-xs font-bold text-slate-900 tracking-wider uppercase hover:text-brand-accent transition-colors ${
                                  hasItems ? "group inline-flex gap-1" : "w-full"
                                }`}
                              >
                                <span>{section.title}</span>
                                <ArrowRight
                                  className={`w-3 h-3 text-brand-accent transition-all ${
                                    hasItems
                                      ? "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                                      : "text-slate-400 group-hover/item:text-brand-accent group-hover/item:translate-x-0.5"
                                  }`}
                                />
                              </Link>

                              {hasItems ? (
                                <div className="space-y-1.5 pl-0.5">
                                  {section.items.map((item) => (
                                    <Link
                                      key={item.id}
                                      href={item.href}
                                      onClick={() => setActiveDropdown(null)}
                                      className="block py-1 text-xs text-slate-600 hover:text-brand-accent transition-colors leading-snug"
                                    >
                                      {item.name}
                                    </Link>
                                  ))}
                                </div>
                              ) : section.description ? (
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-normal">
                                  {section.description}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Featured Luxury Editorial Card */}
                  {pillar.featuredCard && (
                    <div className="col-span-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden border border-brand-border/60 shadow-xs">
                          <Image
                            src={pillar.featuredCard.imageUrl}
                            alt={pillar.featuredCard.title}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            sizes="200px"
                          />
                        </div>
                        <h4 className="font-heading text-sm font-semibold text-slate-900 leading-tight">
                          {pillar.featuredCard.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {pillar.featuredCard.subtitle}
                        </p>
                      </div>

                      <Link
                        href={pillar.featuredCard.href}
                        onClick={() => setActiveDropdown(null)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-dark transition-colors"
                      >
                        <span>{pillar.featuredCard.ctaText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 mt-5 pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Handcrafted in pure cottons, linen, and artisanal weaves
                  </span>
                  <Link
                    href="/collections/women"
                    onClick={() => setActiveDropdown(null)}
                    className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
                  >
                    <span>View All Women&apos;s Wear</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* 2. Dropdown for MEN & POOJA & BRASS */}
            {(pillar.dropdownType === "dropdown-men" || pillar.dropdownType === "dropdown-pooja") && isOpen && (
              <div
                className="border-brand-border/70 bg-white/98 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 absolute top-full left-1/2 z-50 w-[480px] -translate-x-1/2 rounded-2xl border p-5 font-sans backdrop-blur-md"
                onMouseEnter={() => handleMouseEnter(pillar.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-2 gap-5">
                  {/* Category Links Column */}
                  <div className="flex flex-col justify-between border-r border-slate-100 pr-5">
                    {pillar.sections?.[0]?.items && pillar.sections[0].items.length > 0 ? (
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Categories
                        </span>
                        <div className="space-y-1">
                          {pillar.sections[0].items.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setActiveDropdown(null)}
                              className="group block px-2.5 py-1.5 rounded-lg hover:bg-brand-cream/60 transition-colors"
                            >
                              <div className="text-xs font-medium text-slate-800 group-hover:text-brand-accent transition-colors">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-1">
                        <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest block">
                          Curated Collection
                        </span>
                        <h4 className="font-heading text-base font-semibold text-slate-900 leading-snug">
                          {pillar.sections?.[0]?.title || pillar.name}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Handcrafted artisanal essentials curated for discerning tastes and timeless elegance.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 mt-3">
                      <Link
                        href={pillar.href}
                        onClick={() => setActiveDropdown(null)}
                        className="inline-flex items-center justify-between w-full p-2 rounded-lg bg-brand-cream/60 text-brand-dark hover:bg-brand-dark hover:text-brand-cream transition-colors text-xs font-semibold"
                      >
                        <span>View All {pillar.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Featured Card Column */}
                  {pillar.featuredCard && (
                    <div className="flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-brand-border/50 shadow-xs">
                          <Image
                            src={pillar.featuredCard.imageUrl}
                            alt={pillar.featuredCard.title}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            sizes="200px"
                          />
                        </div>
                        <h4 className="font-heading text-sm font-semibold text-slate-900 leading-tight">
                          {pillar.featuredCard.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {pillar.featuredCard.subtitle}
                        </p>
                      </div>

                      <Link
                        href={pillar.featuredCard.href}
                        onClick={() => setActiveDropdown(null)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-dark transition-colors"
                      >
                        <span>{pillar.featuredCard.ctaText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
