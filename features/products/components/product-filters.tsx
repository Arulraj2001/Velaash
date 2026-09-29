"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AvailableFiltersFacet } from "../types";

interface ProductFiltersProps {
  availableFilters: AvailableFiltersFacet;
  currentCategorySlug?: string;
  isMobileDrawer?: boolean;
  onApplyFilters?: () => void;
}

export function ProductFilters({
  availableFilters,
  currentCategorySlug,
  isMobileDrawer = false,
  onApplyFilters,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active filters extracted from URL SearchParams
  const activeSizes = React.useMemo(() => searchParams.getAll("size"), [searchParams]);
  const activeColors = React.useMemo(() => searchParams.getAll("color"), [searchParams]);
  const activeInStock = searchParams.get("inStock") === "true";
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");

  // Helper to update URL search parameters
  const updateUrlParams = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset page to 1 whenever filters change
    params.delete("page");

    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item) params.append(key, item);
        }
      } else if (value !== null && value !== undefined && value !== "") {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(targetUrl, { scroll: false });

    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // Toggle size filter
  const toggleSize = (size: string) => {
    const nextSizes = activeSizes.includes(size)
      ? activeSizes.filter((s) => s !== size)
      : [...activeSizes, size];
    updateUrlParams({ size: nextSizes });
  };

  // Toggle color filter
  const toggleColor = (color: string) => {
    const nextColors = activeColors.includes(color)
      ? activeColors.filter((c) => c !== color)
      : [...activeColors, color];
    updateUrlParams({ color: nextColors });
  };

  // Toggle availability filter
  const toggleInStock = () => {
    updateUrlParams({ inStock: activeInStock ? null : "true" });
  };

  // Price range presets
  const priceRanges = [
    { label: "All Prices", min: null, max: null },
    { label: "Under ₹2,500", min: null, max: "2500" },
    { label: "₹2,500 - ₹5,000", min: "2500", max: "5000" },
    { label: "₹5,000 - ₹7,500", min: "5000", max: "7500" },
    { label: "Above ₹7,500", min: "7500", max: null },
  ];

  const setPriceRange = (min: string | null, max: string | null) => {
    updateUrlParams({ minPrice: min, maxPrice: max });
  };

  const isPriceSelected = (min: string | null, max: string | null) => {
    if (min === null && max === null) {
      return !activeMinPrice && !activeMaxPrice;
    }
    return activeMinPrice === min && activeMaxPrice === max;
  };

  return (
    <div className={`text-brand-dark space-y-6 font-sans ${isMobileDrawer ? "p-1" : ""}`}>
      {/* Category Navigation Links (Only on Shop All page or when no category is fixed) */}
      {!currentCategorySlug && availableFilters.categories.length > 0 && (
        <div className="border-brand-border/60 border-b pb-5">
          <h4 className="text-brand-dark mb-3 text-xs font-semibold tracking-wider uppercase">
            Categories
          </h4>
          <ul className="space-y-1.5 text-xs">
            {availableFilters.categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="text-brand-dark/70 hover:text-brand-accent flex items-center justify-between py-1 transition-colors"
                >
                  <span>{cat.name}</span>
                  <span className="text-brand-dark/40 font-mono text-[11px]">({cat.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sizing Filter Pills */}
      {availableFilters.sizes.length > 0 && (
        <div className="border-brand-border/60 border-b pb-5">
          <h4 className="text-brand-dark mb-3 text-xs font-semibold tracking-wider uppercase">
            Size
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {availableFilters.sizes.map((s) => {
              const isSelected = activeSizes.includes(s.label);
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => toggleSize(s.label)}
                  className={`flex h-9 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? "border-brand-dark bg-brand-dark text-brand-cream shadow-sm"
                      : "border-brand-border/80 text-brand-dark hover:border-brand-gold hover:bg-brand-light/20 bg-white/70"
                  }`}
                  aria-pressed={isSelected}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Filter Swatches */}
      {availableFilters.colors.length > 0 && (
        <div className="border-brand-border/60 border-b pb-5">
          <h4 className="text-brand-dark mb-3 text-xs font-semibold tracking-wider uppercase">
            Color
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {availableFilters.colors.map((c) => {
              const isSelected = activeColors.includes(c.label);
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => toggleColor(c.label)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                    isSelected
                      ? "border-brand-accent bg-brand-light/30 text-brand-dark ring-brand-accent/50 font-medium ring-1"
                      : "border-brand-border/70 text-brand-dark/80 hover:border-brand-gold bg-white/60"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Presets */}
      <div className="border-brand-border/60 border-b pb-5">
        <h4 className="text-brand-dark mb-3 text-xs font-semibold tracking-wider uppercase">
          Price Range
        </h4>
        <div className="space-y-1.5">
          {priceRanges.map((range) => {
            const isSelected = isPriceSelected(range.min, range.max);
            return (
              <label
                key={range.label}
                className="text-brand-dark/80 hover:text-brand-dark flex cursor-pointer items-center gap-2.5 py-1 text-xs"
              >
                <input
                  type="radio"
                  name="price_preset"
                  checked={isSelected}
                  onChange={() => setPriceRange(range.min, range.max)}
                  className="accent-brand-dark h-3.5 w-3.5"
                />
                <span className={isSelected ? "text-brand-dark font-semibold" : ""}>
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Availability / In Stock Toggle */}
      <div className="pt-1">
        <label className="flex cursor-pointer items-center justify-between text-xs">
          <span className="text-brand-dark font-semibold tracking-wider uppercase">
            In Stock Only
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={activeInStock}
            onClick={toggleInStock}
            className={`focus-visible:ring-brand-gold relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:outline-none ${
              activeInStock ? "bg-emerald-700" : "bg-neutral-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                activeInStock ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
