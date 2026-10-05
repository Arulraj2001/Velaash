"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useRecentlyViewed } from "../hooks/use-recently-viewed";
import { MiniProductCard } from "./mini-product-card";

interface RecentlyViewedSectionProps {
  title?: string;
  subtitle?: string;
  excludeProductId?: string;
  maxItems?: number;
  className?: string;
  wrapInContainer?: boolean;
}

export function RecentlyViewedSection({
  title = "Recently Viewed",
  subtitle = "Pick up where you left off",
  excludeProductId,
  maxItems = 8,
  className = "",
  wrapInContainer = true,
}: RecentlyViewedSectionProps) {
  const { items, isLoaded, clearRecentlyViewed } = useRecentlyViewed();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Filter out the current PDP product if specified
  const displayItems = React.useMemo(() => {
    const filtered = excludeProductId
      ? items.filter((p) => p.id !== excludeProductId)
      : items;
    return filtered.slice(0, maxItems);
  }, [items, excludeProductId, maxItems]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!isLoaded || displayItems.length === 0) {
    return null;
  }

  const content = (
    <div className="space-y-4 sm:space-y-5">
      {/* Clean Header — No White Board */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1 text-left">
          {subtitle && (
            <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
              {subtitle}
            </span>
          )}
          <h2 className="font-heading text-brand-dark text-xl sm:text-2xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {displayItems.length > 3 && (
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="w-7 h-7 rounded-full border border-brand-border/80 bg-white flex items-center justify-center text-brand-muted hover:text-brand-dark hover:border-brand-dark transition-colors shadow-2xs"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="w-7 h-7 rounded-full border border-brand-border/80 bg-white flex items-center justify-center text-brand-muted hover:text-brand-dark hover:border-brand-dark transition-colors shadow-2xs"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-muted hover:text-rose-600 transition-colors py-1 px-2 rounded hover:bg-rose-50/80"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Row of Mini/Medium Cards — Directly on page, no white background card */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2 pt-0.5"
      >
        {displayItems.map((product) => (
          <MiniProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );

  return (
    <section
      aria-label="Recently viewed products"
      className={`border-t border-brand-border/60 pt-8 sm:pt-12 mt-12 sm:mt-16 font-sans ${className}`}
    >
      {wrapInContainer ? <Container size="xl">{content}</Container> : content}
    </section>
  );
}
