"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductCard } from "@/features/products/components/product-card";
import type { ProductListItem } from "@/features/products/types";

interface WishlistViewProps {
  initialProducts: ProductListItem[];
}

export function WishlistView({ initialProducts }: WishlistViewProps) {
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);

  const handleWishlistChange = (productId: string, isWishlisted: boolean) => {
    if (!isWishlisted) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
            Saved Wishlist
          </h2>
          <p className="text-xs text-brand-dark/70 font-sans">
            {products.length === 0
              ? "No saved items"
              : products.length === 1
              ? "1 curated piece saved to your personal collection"
              : `${products.length} curated pieces saved to your personal collection`}
          </p>
        </div>

        <Link href="/shop">
          <Button
            type="button"
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="whitespace-nowrap"
          >
            Explore More Products
          </Button>
        </Link>
      </div>

      {/* Wishlist Items Grid or Empty State */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/70 bg-white p-10 sm:p-14 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-100">
            <Heart className="h-7 w-7 fill-rose-200 text-rose-500" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="font-heading text-lg font-semibold text-brand-dark">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-brand-dark/65 leading-relaxed font-sans">
              Save your favorite kurtas, coord sets, and contemporary dresses by tapping the heart icon on any product.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/shop">
              <Button
                type="button"
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Explore Products
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showQuickAdd={true}
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
