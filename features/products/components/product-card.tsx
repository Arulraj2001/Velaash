"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Star } from "lucide-react";
import type { ProductListItem } from "../types";
import { useAuth } from "@/features/auth/components/auth-provider";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: ProductListItem;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Color Swatch Selection State
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);

  // Wishlist Optimistic Toggle State
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [wishlistTooltip, setWishlistTooltip] = React.useState(false);

  // Determine images
  const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
  const secondaryImage = product.images.length > 1 ? product.images[1] : null;

  // If a color swatch with a specific image is selected, display that
  const activeColorObj = selectedColor
    ? product.colors.find((c) => c.color === selectedColor)
    : null;
  const activeImageUrl = activeColorObj?.image_url || primaryImage?.image_url;

  // Badges calculations
  const isNew = Boolean(product.is_new);
  const isSale = product.compare_at_price != null && product.compare_at_price > product.base_price;
  const discountPercent = isSale
    ? Math.round(
        ((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100
      )
    : null;
  const isLowStock = product.total_stock > 0 && product.total_stock <= 5;

  // Handle Wishlist Click
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setWishlistTooltip(true);
      setTimeout(() => setWishlistTooltip(false), 2500);
      router.push(`/account/login?returnUrl=/products/${product.slug}`);
      return;
    }

    setIsWishlisted((prev) => !prev);
    // TODO: Wire real database write to public.wishlists when customer wishlist feature is initialized
    console.log("Toggled wishlist for product:", product.id, !isWishlisted);
  };

  // Handle Swatch Click
  const handleSwatchClick = (e: React.MouseEvent, colorName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor((prev) => (prev === colorName ? null : colorName));
  };

  return (
    <div className="group bg-brand-cream/40 hover:shadow-luxury relative flex flex-col justify-between rounded-xl font-sans transition-all duration-300">
      {/* Clickable Card Link Wrapper */}
      <Link
        href={`/products/${product.slug}`}
        className="focus-visible:ring-brand-gold block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* Image Container with 3:4 Aspect Ratio */}
        <div className="bg-brand-light/20 relative aspect-[3/4] w-full overflow-hidden">
          {/* Primary Product Image */}
          {activeImageUrl ? (
            <Image
              src={activeImageUrl}
              alt={primaryImage?.alt_text || product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 ${
                secondaryImage && !selectedColor
                  ? "transition-opacity duration-500 group-hover:opacity-0"
                  : ""
              }`}
            />
          ) : (
            <div className="bg-brand-light/30 text-brand-dark/40 flex h-full w-full items-center justify-center text-xs">
              Velaash
            </div>
          )}

          {/* Secondary Hover Image (Crossfade on desktop when no color swatch override) */}
          {secondaryImage && !selectedColor && (
            <Image
              src={secondaryImage.image_url}
              alt={secondaryImage.alt_text || `${product.name} back view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="absolute inset-0 hidden object-cover object-top opacity-0 transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-100 sm:block"
            />
          )}

          {/* Stackable Badges (Top-Left) */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
            {isNew && (
              <span className="bg-brand-dark/90 text-brand-gold rounded-full px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase shadow-sm backdrop-blur-xs">
                New
              </span>
            )}
            {isSale && discountPercent && (
              <span className="rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
            {isLowStock && (
              <span className="rounded-full bg-amber-600/95 px-2 py-0.5 text-[10px] font-medium tracking-wider text-white shadow-sm backdrop-blur-xs">
                Only {product.total_stock} Left
              </span>
            )}
          </div>

          {/* Wishlist Heart Button (Top-Right) */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="text-brand-dark focus-visible:ring-brand-gold absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-xs transition-transform duration-200 hover:scale-110 hover:bg-white focus-visible:ring-2 focus-visible:outline-none active:scale-95"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isWishlisted
                  ? "fill-rose-600 text-rose-600"
                  : "text-brand-dark/70 hover:text-brand-dark"
              }`}
            />
          </button>

          {/* Unauthenticated Login Prompt Toast */}
          {wishlistTooltip && (
            <div className="animate-in fade-in-0 zoom-in-95 bg-brand-dark text-brand-cream shadow-luxury absolute top-12 right-2.5 z-30 rounded-md px-2.5 py-1 text-[11px]">
              Please sign in to save items
            </div>
          )}
        </div>

        {/* Product Details Section Below Image */}
        <div className="space-y-1.5 p-3 sm:p-4">
          {/* Category Tag & Rating Row */}
          <div className="text-brand-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-brand-accent truncate text-[10px] font-medium tracking-wider uppercase">
              {product.category_name || "Velaash"}
            </span>

            {/* Star Rating Display (Omitted if no reviews) */}
            {product.rating && product.rating.count > 0 && (
              <div className="text-brand-dark flex items-center gap-1 font-medium">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{product.rating.average.toFixed(1)}</span>
                <span className="text-brand-dark/40 text-[10px]">({product.rating.count})</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3
            className="font-heading text-brand-dark group-hover:text-brand-accent line-clamp-1 text-base leading-snug font-medium transition-colors sm:text-lg"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-brand-dark text-sm font-semibold sm:text-base">
              {formatCurrency(product.base_price)}
            </span>

            {isSale && product.compare_at_price && (
              <span className="text-brand-dark/40 text-xs line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Color Swatches (Rendered outside the Link to allow interactive swatch clicking) */}
      {product.colors.length > 0 && (
        <div className="px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((swatch) => {
              const isSelected = selectedColor === swatch.color;
              return (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={(e) => handleSwatchClick(e, swatch.color)}
                  aria-label={`View ${swatch.color} color`}
                  title={swatch.color}
                  className={`h-4 w-4 rounded-full border transition-all ${
                    isSelected
                      ? "ring-brand-gold scale-110 border-transparent ring-2 ring-offset-1"
                      : "border-brand-border/80 hover:scale-105"
                  }`}
                  style={{ backgroundColor: swatch.color_hex }}
                />
              );
            })}

            {product.colors.length > 4 && (
              <span className="text-brand-dark/60 pl-0.5 text-[10px] font-medium">
                +{product.colors.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
