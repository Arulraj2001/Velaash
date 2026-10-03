"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight, Sparkles, Tag } from "lucide-react";
import type { NavigationCategory } from "@/features/navigation";
import type { ShippingPolicySetting } from "@/features/settings";
import { groupNavigationCategories, type NavPillar } from "@/features/navigation/utils/group-navigation";

interface HeaderNavProps {
  categories: NavigationCategory[];
  shippingPolicy?: ShippingPolicySetting;
}

export function HeaderNav({ categories, shippingPolicy }: HeaderNavProps) {
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const pillars = React.useMemo(
    () => groupNavigationCategories(categories, shippingPolicy),
    [categories, shippingPolicy]
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

        // Custom Highlight for Festive Offers
        if (pillar.isSpecial) {
          return (
            <div
              key={pillar.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(pillar.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center py-4">
                <Link
                  href={pillar.href}
                  className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-all text-xs font-semibold tracking-wider uppercase shadow-2xs"
                  onFocus={() => setActiveDropdown(pillar.id)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>{pillar.name}</span>
                  {pillar.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-600 text-white tracking-widest">
                      {pillar.badge}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-3 w-3 text-amber-700 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </Link>
              </div>

              {/* Festive Offers Dropdown */}
              {isOpen && (
                <div
                  className="border-amber-200/90 bg-white shadow-2xl animate-in fade-in-0 slide-in-from-top-2 absolute top-full left-1/2 z-50 w-80 -translate-x-1/2 rounded-2xl border p-4 font-sans backdrop-blur-md"
                  onMouseEnter={() => handleMouseEnter(pillar.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {pillar.featuredCard && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-transparent border border-amber-200/80 mb-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>{pillar.featuredCard.title}</span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 leading-relaxed">
                        {pillar.featuredCard.subtitle}
                      </p>
                    </div>
                  )}

                  {pillar.sections && pillar.sections[0] && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block">
                        Quick Shortcuts
                      </span>
                      {pillar.sections[0].items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-amber-900 hover:bg-amber-50/80 transition-colors"
                        >
                          <span>{item.name}</span>
                          <ArrowRight className="w-3 h-3 text-amber-600 opacity-60" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <Link
                      href="/shop"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center justify-center gap-1.5 text-center w-full py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <span>Explore All Festive Items</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Standard Navigation Pillars (Women, Men, Pooja, All)
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
                    {pillar.sections?.map((section) => (
                      <div key={section.title} className="space-y-3">
                        <Link
                          href={section.href || pillar.href}
                          onClick={() => setActiveDropdown(null)}
                          className="group inline-flex items-center gap-1 text-xs font-bold text-slate-900 tracking-wider uppercase hover:text-brand-accent transition-colors"
                        >
                          <span>{section.title}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-accent" />
                        </Link>

                        <div className="space-y-1.5">
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
                    href="/shop"
                    onClick={() => setActiveDropdown(null)}
                    className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
                  >
                    <span>View All Collections</span>
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
                  <div className="space-y-3 border-r border-slate-100 pr-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Categories
                    </span>
                    <div className="space-y-1">
                      {pillar.sections?.[0]?.items.map((item) => (
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

                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href={pillar.href}
                        onClick={() => setActiveDropdown(null)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
                      >
                        <span>View All {pillar.name}</span>
                        <ArrowRight className="w-3 h-3" />
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
