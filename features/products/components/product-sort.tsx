"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

export function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "featured";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSort = e.target.value;

    if (nextSort === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }
    // Reset page to 1 on sort change
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 font-sans text-xs">
      <label htmlFor="catalog-sort" className="text-brand-muted hidden font-medium sm:inline">
        Sort by:
      </label>
      <div className="relative inline-flex items-center">
        <select
          id="catalog-sort"
          value={currentSort}
          onChange={handleSortChange}
          className="border-brand-border text-brand-dark hover:border-brand-gold focus-visible:ring-brand-gold cursor-pointer appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="text-brand-muted pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
      </div>
    </div>
  );
}
