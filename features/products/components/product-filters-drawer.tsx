"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "./product-filters";
import type { AvailableFiltersFacet } from "../types";

interface ProductFiltersDrawerProps {
  availableFilters: AvailableFiltersFacet;
  currentCategorySlug?: string;
}

export function ProductFiltersDrawer({
  availableFilters,
  currentCategorySlug,
}: ProductFiltersDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Calculate active filter count
  const activeSizes = searchParams.getAll("size");
  const activeColors = searchParams.getAll("color");
  const activeInStock = searchParams.get("inStock") === "true";
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");

  let activeFilterCount = 0;
  activeFilterCount += activeSizes.length;
  activeFilterCount += activeColors.length;
  if (activeInStock) activeFilterCount++;
  if (activeMinPrice || activeMaxPrice) activeFilterCount++;

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("size");
    params.delete("color");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("inStock");
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Filter Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-brand-border text-brand-dark hover:bg-brand-light/30 focus-visible:ring-brand-gold flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none md:hidden"
      >
        <SlidersHorizontal className="text-brand-accent h-4 w-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-brand-dark text-brand-gold flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Drawer Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="bg-brand-dark/60 fixed inset-0 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="bg-brand-cream relative ml-auto flex h-full w-full max-w-xs flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="border-brand-border/80 flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="text-brand-accent h-4 w-4" />
                <h3 className="font-heading text-brand-dark text-lg font-semibold">
                  Refine Collection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-brand-muted hover:bg-brand-light/40 hover:text-brand-dark rounded-full p-1.5"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Filter Options */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <ProductFilters
                availableFilters={availableFilters}
                currentCategorySlug={currentCategorySlug}
                isMobileDrawer
                onApplyFilters={() => setIsOpen(false)}
              />
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-brand-border/80 bg-brand-card flex items-center gap-3 border-t p-4">
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" className="w-1/2" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                className={activeFilterCount > 0 ? "w-1/2" : "w-full"}
                onClick={() => setIsOpen(false)}
              >
                Show Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
