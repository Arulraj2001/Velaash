"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { ProductListItem } from "../types";

interface MiniProductCardProps {
  product: ProductListItem;
  className?: string;
}

export function MiniProductCard({ product, className = "" }: MiniProductCardProps) {
  const primaryImage =
    product.images?.[0]?.image_url ||
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80";

  const isSale =
    product.compare_at_price != null && product.compare_at_price > product.base_price;
  const discountPercent = isSale
    ? Math.round(
        ((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100
      )
    : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch={true}
      className={`group flex flex-col shrink-0 w-36 sm:w-48 rounded-xl bg-white border border-brand-border/70 hover:border-brand-gold/70 p-2 sm:p-2.5 transition-all duration-200 hover:shadow-md snap-start ${className}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-100 mb-2">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 144px, 192px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start pointer-events-none">
          {isSale && discountPercent && (
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {!isSale && product.is_featured && (
            <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-xs">
              Bestseller
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 flex-1 justify-between">
        {product.category_name && (
          <span className="text-[10px] text-brand-muted/80 uppercase tracking-wider truncate">
            {product.category_name}
          </span>
        )}
        <h4 className="text-[11px] sm:text-xs font-medium text-brand-dark line-clamp-1 group-hover:text-brand-accent transition-colors">
          {product.name}
        </h4>
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-xs sm:text-sm font-semibold text-brand-dark">
            {formatCurrency(product.base_price)}
          </span>
          {isSale && product.compare_at_price && (
            <span className="text-[10px] text-brand-muted line-through">
              {formatCurrency(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
