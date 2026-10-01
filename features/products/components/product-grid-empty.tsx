"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import type { ProductListItem } from "../types";

interface ProductGridEmptyProps {
  featuredProducts?: ProductListItem[];
}

export function ProductGridEmpty({ featuredProducts }: ProductGridEmptyProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleReset = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="border-brand-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 px-6 py-12 sm:py-16 text-center font-sans">
      <div className="bg-brand-light/30 text-brand-accent mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Sparkles className="h-6 w-6" />
      </div>

      <h3 className="font-heading text-brand-dark mb-2 text-xl font-semibold sm:text-2xl">
        No matching designs found
      </h3>

      <p className="text-brand-muted mb-6 max-w-md text-xs leading-relaxed sm:text-sm">
        We couldn&apos;t find any pieces matching your chosen combination of filters or search query. Try adjusting
        your preferences or browsing our featured collections.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={handleReset}
        >
          Reset All Filters
        </Button>
        <Link href="/shop">
          <Button variant="outline" size="sm">
            Browse All Styles
          </Button>
        </Link>
      </div>

      {/* Featured Suggestions Row ("You Might Like") */}
      {featuredProducts && featuredProducts.length > 0 && (
        <div className="mt-12 w-full border-t border-brand-border/60 pt-10 text-left">
          <div className="mb-6 space-y-1 text-center sm:text-left">
            <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
              Curated Selection
            </span>
            <h4 className="font-heading text-brand-dark text-xl font-semibold sm:text-2xl">
              You Might Like
            </h4>
            <p className="text-xs text-brand-muted">
              Explore our most popular everyday luxury silhouettes and signature essentials.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
