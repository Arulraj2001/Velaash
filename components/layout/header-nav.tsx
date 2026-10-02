"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import type { NavigationCategory } from "@/features/navigation";

interface HeaderNavProps {
  categories: NavigationCategory[];
}

export function HeaderNav({ categories }: HeaderNavProps) {
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (catId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(catId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
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
    <nav aria-label="Main Store Navigation" className="hidden items-center gap-3 md:flex lg:gap-5 xl:gap-6">
      {categories.map((cat) => {
        const hasSub = cat.subcategories && cat.subcategories.length > 0;
        const isOpen = activeDropdown === cat.id;

        return (
          <div
            key={cat.id}
            className="relative"
            onMouseEnter={() => handleMouseEnter(cat.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center gap-1 py-4">
              <Link
                href={`/collections/${cat.slug}`}
                className="text-brand-muted hover:text-brand-accent after:bg-brand-gold relative py-1 text-xs font-medium tracking-widest uppercase transition-colors duration-150 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:transition-all hover:after:w-full"
                onFocus={() => setActiveDropdown(cat.id)}
              >
                {cat.name}
              </Link>
              {hasSub && (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`${cat.name} subcategories`}
                  className="text-brand-muted hover:text-brand-accent rounded p-1"
                  onClick={() => setActiveDropdown(isOpen ? null : cat.id)}
                >
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      isOpen ? "text-brand-accent rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {hasSub && isOpen && (
              <div
                className="border-brand-border/60 bg-brand-card shadow-lg animate-in fade-in-0 zoom-in-95 absolute top-full left-1/2 z-50 w-72 -translate-x-1/2 rounded-xl border p-3 font-sans"
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="border-brand-border/50 mb-1 flex items-center justify-between border-b px-2 py-1.5">
                  <span className="text-brand-accent text-[11px] font-semibold tracking-wider uppercase">
                    {cat.name}
                  </span>
                  <Link
                    href={`/collections/${cat.slug}`}
                    onClick={() => setActiveDropdown(null)}
                    className="text-brand-muted hover:text-brand-accent flex items-center gap-0.5 text-[11px] font-medium hover:underline"
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-1 py-1">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/collections/${sub.slug}`}
                      onClick={() => setActiveDropdown(null)}
                      className="group hover:bg-brand-light/30 flex flex-col rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      <span className="text-brand-dark group-hover:text-brand-accent text-xs font-medium transition-colors">
                        {sub.name}
                      </span>
                      {sub.description && (
                        <span className="text-brand-muted truncate text-[11px]">
                          {sub.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
