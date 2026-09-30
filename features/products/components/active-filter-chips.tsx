"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

interface ActiveFilterChipsProps {
  totalCount: number;
}

export function ActiveFilterChips({ totalCount }: ActiveFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSizes = searchParams.getAll("size");
  const activeColors = searchParams.getAll("color");
  const activeInStock = searchParams.get("inStock") === "true";
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");

  const hasAnyFilter =
    activeSizes.length > 0 ||
    activeColors.length > 0 ||
    activeInStock ||
    Boolean(activeMinPrice || activeMaxPrice);

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (key === "size" && value) {
      const remaining = activeSizes.filter((s) => s !== value);
      params.delete("size");
      remaining.forEach((s) => params.append("size", s));
    } else if (key === "color" && value) {
      const remaining = activeColors.filter((c) => c !== value);
      params.delete("color");
      remaining.forEach((c) => params.append("color", c));
    } else if (key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else if (key === "inStock") {
      params.delete("inStock");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

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
  };

  let priceLabel = "";
  if (activeMinPrice && activeMaxPrice) {
    priceLabel = `₹${activeMinPrice} - ₹${activeMaxPrice}`;
  } else if (activeMinPrice) {
    priceLabel = `Above ₹${activeMinPrice}`;
  } else if (activeMaxPrice) {
    priceLabel = `Under ₹${activeMaxPrice}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 font-sans">
      {/* Product count */}
      <span className="text-brand-muted text-xs font-medium">
        Showing <span className="text-brand-dark font-semibold">{totalCount}</span>{" "}
        {totalCount === 1 ? "design" : "designs"}
      </span>

      {/* Chips cluster */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeSizes.map((size) => (
            <span
              key={`size-${size}`}
              className="bg-brand-light/40 border-brand-border/80 text-brand-dark inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
            >
              Size: {size}
              <button
                type="button"
                onClick={() => removeFilter("size", size)}
                className="text-brand-muted hover:text-brand-dark"
                aria-label={`Remove ${size} size filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {activeColors.map((color) => (
            <span
              key={`color-${color}`}
              className="bg-brand-light/40 border-brand-border/80 text-brand-dark inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
            >
              Color: {color}
              <button
                type="button"
                onClick={() => removeFilter("color", color)}
                className="text-brand-muted hover:text-brand-dark"
                aria-label={`Remove ${color} color filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {priceLabel && (
            <span className="bg-brand-light/40 border-brand-border/80 text-brand-dark inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium">
              {priceLabel}
              <button
                type="button"
                onClick={() => removeFilter("price")}
                className="text-brand-muted hover:text-brand-dark"
                aria-label="Remove price filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeInStock && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
              In Stock
              <button
                type="button"
                onClick={() => removeFilter("inStock")}
                className="text-emerald-700 hover:text-emerald-900"
                aria-label="Remove in-stock filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Clear all button */}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-brand-accent pl-1 text-[11px] font-semibold hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
