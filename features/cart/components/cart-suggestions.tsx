"use client";

import React, { useEffect, useState } from "react";
import { ProductCard } from "@/features/products/components/product-card";
import { getCartSuggestionsAction } from "../actions/cart-suggestions";
import type { ProductListItem } from "@/features/products/types";

interface CartSuggestionsProps {
  cartProductIds: string[];
}

export function CartSuggestions({ cartProductIds }: CartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ProductListItem[]>([]);
  const [isPending, startTransition] = React.useTransition();

  // Serialize product IDs to avoid re-triggering on reference changes
  const serializedIds = React.useMemo(
    () => Array.from(new Set(cartProductIds)).sort().join(","),
    [cartProductIds]
  );

  useEffect(() => {
    let isCancelled = false;

    if (!serializedIds) {
      return;
    }

    const ids = serializedIds.split(",");

    startTransition(async () => {
      try {
        const items = await getCartSuggestionsAction(ids);
        if (!isCancelled) {
          setSuggestions(items);
        }
      } catch (err) {
        console.error("Failed to load cart suggestions:", err);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [serializedIds]);

  if (!cartProductIds || cartProductIds.length === 0) {
    return null;
  }

  if (suggestions.length === 0 && !isPending) {
    return null;
  }

  return (
    <section className="mt-14 sm:mt-20 border-t border-brand-border/70 pt-10 sm:pt-14 font-sans">
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
            Curated Complements
          </span>
          <h2 className="font-heading text-brand-dark text-2xl font-semibold sm:text-3xl">
            You May Also Like
          </h2>
          <p className="text-xs text-brand-muted">
            Pieces styled to pair effortlessly with items in your shopping bag.
          </p>
        </div>

        {isPending && suggestions.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-brand-cream/60 animate-pulse border border-brand-border/40"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {suggestions.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
