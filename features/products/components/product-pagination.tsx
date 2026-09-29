"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ARCHITECTURAL DECISION: URL-Based Server-Rendered Pagination vs. Client "Load More"
 *
 * We chose URL-based server-rendered pagination (?page=N) over client-side infinite scroll or
 * "Load More" buttons for the following key production advantages in Next.js App Router:
 *
 * 1. SEO & Crawlability: Search engines (Googlebot) can index deep catalog pages deterministically
 *    via regular href links with canonical parameters, ensuring complete product indexing.
 * 2. Deep Linking & Shareability: Shoppers sharing a link (e.g. ?page=2) or refreshing their tab
 *    land on the exact same product subset without losing their place.
 * 3. Browser History Integrity: Clicking into a product card and hitting "Back" in the browser
 *    faithfully returns the customer to their specific page without re-fetching or resetting scroll.
 * 4. Mobile DOM Performance: Prevents memory accumulation and layout thrashing caused by hundreds
 *    of luxury images stacked in the DOM simultaneously.
 */

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductPagination({ currentPage, totalPages }: ProductPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber <= 1) {
      params.delete("page");
    } else {
      params.set("page", pageNumber.toString());
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  // Generate page numbers to show
  const pageNumbers: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pageNumbers.push(i);
    } else if (
      pageNumbers[pageNumbers.length - 1] !== "..." &&
      (i === currentPage - 2 || i === currentPage + 2)
    ) {
      pageNumbers.push("...");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 pt-12 pb-6 font-sans text-xs"
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="border-brand-border text-brand-dark hover:bg-brand-light/30 focus-visible:ring-brand-gold flex h-9 items-center gap-1 rounded-lg border bg-white px-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className="border-brand-border/40 text-brand-dark/30 flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border bg-neutral-100 px-3">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {/* Numbered Page Buttons */}
      <div className="flex items-center gap-1 px-1">
        {pageNumbers.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="text-brand-dark/40 flex h-9 w-8 items-center justify-center"
              >
                ...
              </span>
            );
          }

          const isCurrent = p === currentPage;
          return (
            <Link
              key={`page-${p}`}
              href={createPageUrl(p as number)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                isCurrent
                  ? "border-brand-dark bg-brand-dark text-brand-gold font-semibold shadow-sm"
                  : "border-brand-border text-brand-dark hover:border-brand-gold hover:bg-brand-light/20 bg-white"
              }`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="border-brand-border text-brand-dark hover:bg-brand-light/30 focus-visible:ring-brand-gold flex h-9 items-center gap-1 rounded-lg border bg-white px-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="border-brand-border/40 text-brand-dark/30 flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border bg-neutral-100 px-3">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
