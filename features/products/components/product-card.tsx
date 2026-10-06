"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Star, ShoppingBag, ArrowRight } from "lucide-react";
import type { ProductListItem } from "../types";
import { getProductFestiveShippingBadge } from "../types";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useWishlistStore } from "@/features/wishlist/store/wishlist-store";
import { useCartStore } from "@/features/cart/store/cart-store";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: ProductListItem;
  priority?: boolean;
  showQuickAdd?: boolean;
  size?: "default" | "medium";
  onWishlistChange?: (productId: string, isWishlisted: boolean) => void;
}

export function ProductCard({
  product,
  priority = false,
  showQuickAdd = false,
  size = "default",
  onWishlistChange,
}: ProductCardProps) {
  const isMedium = size === "medium";
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Color Swatch Selection State
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);

  // Global Wishlist Store State
  const isWishlisted = useWishlistStore((state) => state.wishlistIds.includes(product.id));
  const [isTogglingWishlist, setIsTogglingWishlist] = React.useState(false);
  const [wishlistTooltip, setWishlistTooltip] = React.useState<string | null>(null);

  // Quick Add State feedback
  const [isAddedFeedback, setIsAddedFeedback] = React.useState(false);

  // Determine images
  const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
  const secondaryImage = product.images.length > 1 ? product.images[1] : null;

  // If a color swatch with a specific image is selected, display that
  const activeColorObj = selectedColor
    ? product.colors.find((c) => c.color === selectedColor)
    : null;
  const activeImageUrl = activeColorObj?.image_url || primaryImage?.image_url;

  // Badges & stock calculations
  const festiveBadge = getProductFestiveShippingBadge(product);
  const isNew = Boolean(product.is_new);
  const isSale = product.compare_at_price != null && product.compare_at_price > product.base_price;
  const discountPercent = isSale
    ? Math.round(
        ((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100
      )
    : null;
  const isLowStock = product.total_stock > 0 && product.total_stock <= 5;
  const isOutOfStock = product.total_stock <= 0 || product.stock_status === "out_of_stock";
  const isInactive = product.is_active === false;

  // Variants info for Quick Add
  const activeVariants = product.variants.filter((v) => v.is_active);
  const isSimpleProduct = product.has_variants === false || product.variants.length === 0;
  const hasSingleVariant = activeVariants.length === 1;
  const canQuickAdd = isSimpleProduct || hasSingleVariant;

  // Handle Wishlist Click (Optimistic update with automatic server rollback on failure)
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setWishlistTooltip("Please sign in to save items");
      setTimeout(() => setWishlistTooltip(null), 2500);
      router.push(`/account/login?returnUrl=/products/${product.slug}`);
      return;
    }

    if (isTogglingWishlist) return;
    setIsTogglingWishlist(true);

    try {
      const result = await useWishlistStore.getState().toggleWishlist(product.id);

      if (!result.success && result.error) {
        setWishlistTooltip(result.error);
        setTimeout(() => setWishlistTooltip(null), 3000);
      } else if (onWishlistChange) {
        onWishlistChange(product.id, Boolean(result.isWishlisted));
      }
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Handle Quick Add to Cart (Simple products or Single Variant Products)
  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInactive || isOutOfStock || !canQuickAdd) return;

    const singleVariant = !isSimpleProduct ? activeVariants[0] : null;
    const imgUrl = activeImageUrl || primaryImage?.image_url || "/placeholder.jpg";
    const variantPrice = singleVariant?.price_override ?? product.base_price;
    const maxStock = singleVariant ? singleVariant.stock_quantity : (product.stock_quantity ?? product.total_stock ?? 999);

    useCartStore.getState().addItem(
      {
        productId: product.id,
        variantId: singleVariant?.id || null,
        title: product.name,
        slug: product.slug,
        size: singleVariant?.size || null,
        color: singleVariant?.color || null,
        colorHex: singleVariant?.color_hex || undefined,
        price: variantPrice,
        compareAtPrice: product.compare_at_price,
        image: imgUrl,
        maxStock,
      },
      1
    );

    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 2000);
  };

  // Handle Swatch Click
  const handleSwatchClick = (e: React.MouseEvent, colorName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor((prev) => (prev === colorName ? null : colorName));
  };

  return (
    <div
      className={`group bg-brand-cream/40 hover:shadow-luxury relative flex flex-col justify-between rounded-xl font-sans transition-all duration-300 ${
        isInactive ? "opacity-85" : ""
      }`}
    >
      {/* Clickable Card Link Wrapper */}
      <Link
        href={`/products/${product.slug}`}
        className="focus-visible:ring-brand-gold block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* Image Container with 4:5 Aspect Ratio and Height Cap */}
        <div
          className={`bg-brand-light/20 relative aspect-[4/5] w-full overflow-hidden ${
            isMedium
              ? "max-h-[220px] sm:max-h-[240px] md:max-h-[260px]"
              : "max-h-[310px] sm:max-h-[340px]"
          }`}
        >
          {/* Primary Product Image */}
          {activeImageUrl ? (
            <Image
              src={activeImageUrl}
              alt={primaryImage?.alt_text || product.name}
              fill
              priority={priority}
              quality={72}
              sizes={
                isMedium
                  ? "(max-width: 640px) 48vw, (max-width: 768px) 32vw, (max-width: 1024px) 24vw, 19vw"
                  : "(max-width: 640px) calc((100vw - 2rem - 0.875rem) / 2), (max-width: 1024px) calc((100vw - 2rem - 2.5rem) / 3), 25vw"
              }
              className={`object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 ${
                isInactive ? "grayscale-30" : ""
              } ${
                secondaryImage && !selectedColor
                  ? "transition-opacity duration-500 group-hover:opacity-0"
                  : ""
              }`}
            />
          ) : (
            <div className="bg-brand-light/30 text-brand-muted flex h-full w-full items-center justify-center text-xs">
              Velaash
            </div>
          )}

          {/* Secondary Hover Image (Crossfade on hover when no color swatch override) */}
          {secondaryImage && !selectedColor && !isInactive && (
            <Image
              src={secondaryImage.image_url}
              alt={secondaryImage.alt_text || `${product.name} back view`}
              fill
              quality={72}
              sizes={
                isMedium
                  ? "(max-width: 640px) 48vw, (max-width: 768px) 32vw, (max-width: 1024px) 24vw, 19vw"
                  : "(max-width: 640px) calc((100vw - 2rem - 0.875rem) / 2), (max-width: 1024px) calc((100vw - 2rem - 2.5rem) / 3), 25vw"
              }
              className="absolute inset-0 object-cover object-top opacity-0 transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
            />
          )}

          {/* Stackable Badges (Top-Left) */}
          <div
            className={`pointer-events-none absolute z-10 flex flex-col items-start ${
              isMedium ? "top-2 left-2 gap-1" : "top-2.5 left-2.5 gap-1.5"
            }`}
          >
            {isInactive ? (
              <span
                className={`bg-zinc-800/90 text-white rounded-full font-medium tracking-wider uppercase shadow-sm backdrop-blur-xs ${
                  isMedium ? "px-1.5 py-0.5 text-[8.5px]" : "px-2 py-0.5 text-[10px]"
                }`}
              >
                No Longer Available
              </span>
            ) : (
              <>
                {festiveBadge && (
                  <span
                    className={`rounded-full bg-emerald-900/90 text-amber-200 border border-emerald-600/50 font-semibold tracking-wide shadow-sm backdrop-blur-xs ${
                      isMedium ? "px-1.5 py-0.5 text-[8.5px] sm:text-[9px]" : "px-2 py-0.5 text-[9px] sm:text-[10px]"
                    }`}
                  >
                    {festiveBadge}
                  </span>
                )}
                {isNew && (
                  <span
                    className={`bg-brand-dark/90 text-brand-gold rounded-full font-medium tracking-widest uppercase shadow-sm backdrop-blur-xs ${
                      isMedium ? "px-1.5 py-0.5 text-[8.5px] sm:text-[9px]" : "px-2 py-0.5 text-[10px]"
                    }`}
                  >
                    New
                  </span>
                )}
                {/* Bestseller badge — shows for is_featured products that aren't also "New" */}
                {!isNew && product.is_featured && !isOutOfStock && (
                  <span
                    className={`rounded-full bg-amber-600/90 text-white font-semibold tracking-wide uppercase shadow-sm backdrop-blur-xs flex items-center gap-1 ${
                      isMedium ? "px-1.5 py-0.5 text-[8.5px] sm:text-[9px]" : "px-2 py-0.5 text-[10px]"
                    }`}
                  >
                    <span>🔥</span>
                    <span>Bestseller</span>
                  </span>
                )}
                {isSale && discountPercent && (
                  <span
                    className={`rounded-full bg-rose-700 font-semibold tracking-wider text-white uppercase shadow-sm ${
                      isMedium ? "px-1.5 py-0.5 text-[8.5px] sm:text-[9px]" : "px-2 py-0.5 text-[10px]"
                    }`}
                  >
                    {discountPercent}% OFF
                  </span>
                )}
                {isOutOfStock ? (
                  <span
                    className={`rounded-full bg-zinc-700/90 font-medium tracking-wider text-white shadow-sm backdrop-blur-xs ${
                      isMedium ? "px-1.5 py-0.5 text-[8.5px] sm:text-[9px]" : "px-2 py-0.5 text-[10px]"
                    }`}
                  >
                    Out of Stock
                  </span>
                ) : (
                  isLowStock && (
                    <span
                      className={`rounded-full bg-amber-600/95 font-medium tracking-wider text-white shadow-sm backdrop-blur-xs ${
                        isMedium ? "px-1.5 py-0.5 text-[8.5px] sm:text-[9px]" : "px-2 py-0.5 text-[10px]"
                      }`}
                    >
                      Only {product.total_stock} Left
                    </span>
                  )
                )}
              </>
            )}
          </div>

          {/* Wishlist Heart Button (Top-Right) */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            disabled={isTogglingWishlist}
            className={`text-brand-dark focus-visible:ring-brand-gold absolute z-20 flex items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-xs transition-transform duration-200 hover:scale-110 hover:bg-white focus-visible:ring-2 focus-visible:outline-none active:scale-95 disabled:opacity-70 ${
              isMedium ? "top-2 right-2 h-7 w-7" : "top-2.5 right-2.5 h-8 w-8"
            }`}
          >
            <Heart
              className={`transition-colors ${
                isMedium ? "h-3.5 w-3.5" : "h-4 w-4"
              } ${
                isWishlisted
                  ? "fill-rose-600 text-rose-600"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            />
          </button>

          {/* Tooltip Toast */}
          {wishlistTooltip && (
            <div className="animate-in fade-in-0 zoom-in-95 bg-brand-dark text-brand-cream shadow-luxury absolute top-12 right-2.5 z-30 rounded-md px-2.5 py-1 text-[11px] whitespace-nowrap">
              {wishlistTooltip}
            </div>
          )}
        </div>

        {/* Product Details Section Below Image */}
        <div className={isMedium ? "space-y-0.5 p-2 sm:p-2.5" : "space-y-1 p-2.5 sm:p-3"}>
          {/* Category Tag & Rating Row */}
          <div
            className={`text-brand-muted flex items-center justify-between ${
              isMedium ? "text-[10px]" : "text-[11px]"
            }`}
          >
            <span
              className={`text-brand-accent-dark truncate font-semibold tracking-wider uppercase ${
                isMedium ? "text-[10px]" : "text-[11px]"
              }`}
            >
              {product.category_name || "Velaash"}
            </span>

            {/* Star Rating Display (Omitted if no reviews) */}
            {product.rating && product.rating.count > 0 && (
              <div className="text-brand-dark flex items-center gap-1 font-medium">
                <Star
                  className={
                    isMedium
                      ? "h-2.5 w-2.5 fill-amber-500 text-amber-500"
                      : "h-3 w-3 fill-amber-500 text-amber-500"
                  }
                />
                <span>{product.rating.average.toFixed(1)}</span>
                <span className={`text-brand-muted ${isMedium ? "text-[9px]" : "text-[10px]"}`}>
                  ({product.rating.count})
                </span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3
            className={`font-heading text-brand-dark group-hover:text-brand-accent line-clamp-1 font-medium leading-snug transition-colors ${
              isMedium ? "text-xs sm:text-[13px]" : "text-sm sm:text-base"
            }`}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span
              className={`text-brand-dark font-semibold ${
                isMedium ? "text-xs sm:text-sm" : "text-sm sm:text-base"
              }`}
            >
              {formatCurrency(product.base_price)}
            </span>

            {isSale && product.compare_at_price && (
              <span
                className={`text-brand-subtle line-through ${
                  isMedium ? "text-[10.5px] sm:text-xs" : "text-xs"
                }`}
              >
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Color Swatches (Rendered outside the Link to allow interactive swatch clicking) */}
      {product.colors.length > 0 && (
        <div
          className={
            isMedium
              ? "px-2 pt-0 pb-2 sm:px-2.5 sm:pb-2.5"
              : "px-2.5 pt-0 pb-2.5 sm:px-3 sm:pb-3"
          }
        >
          <div className="flex items-center gap-1">
            {product.colors.slice(0, 4).map((swatch) => {
              const isSelected = selectedColor === swatch.color;
              return (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={(e) => handleSwatchClick(e, swatch.color)}
                  aria-label={`View ${swatch.color} color`}
                  title={swatch.color}
                  className={`rounded-full border transition-all ${
                    isMedium ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : "h-4 w-4"
                  } ${
                    isSelected
                      ? "ring-brand-gold scale-110 border-transparent ring-2 ring-offset-1"
                      : "border-brand-border/80 hover:scale-105"
                  }`}
                  style={{ backgroundColor: swatch.color_hex }}
                />
              );
            })}

            {product.colors.length > 4 && (
              <span
                className={`text-brand-muted pl-0.5 font-medium ${
                  isMedium ? "text-[9px]" : "text-[10px]"
                }`}
              >
                +{product.colors.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Action (Visible on Wishlist Grid) */}
      {showQuickAdd && (
        <div
          className={
            isMedium
              ? "px-2 pb-2 sm:px-2.5 sm:pb-2.5 pt-0.5"
              : "px-3 pb-3 sm:px-4 sm:pb-4 pt-1"
          }
        >
          {isInactive ? (
            <button
              type="button"
              disabled
              className={`w-full rounded-lg bg-zinc-200 text-zinc-500 font-medium cursor-not-allowed ${
                isMedium ? "py-1.5 text-[11px]" : "py-2.5 text-xs"
              }`}
            >
              Unavailable
            </button>
          ) : isOutOfStock ? (
            <button
              type="button"
              disabled
              className={`w-full rounded-lg bg-zinc-200 text-zinc-500 font-medium cursor-not-allowed ${
                isMedium ? "py-1.5 text-[11px]" : "py-2.5 text-xs"
              }`}
            >
              Out of Stock
            </button>
          ) : canQuickAdd ? (
            <button
              type="button"
              onClick={handleQuickAddToCart}
              className={`w-full rounded-lg font-semibold flex items-center justify-center gap-1 shadow-xs transition-all duration-150 ${
                isMedium ? "py-1.5 sm:py-2 text-[11px] sm:text-xs" : "py-2.5 text-xs gap-1.5"
              } ${
                isAddedFeedback
                  ? "bg-emerald-700 text-white"
                  : "bg-brand-dark text-brand-cream hover:bg-brand-accent active:scale-98"
              }`}
            >
              <ShoppingBag className={isMedium ? "h-3 w-3" : "h-3.5 w-3.5"} />
              <span>{isAddedFeedback ? "Added to Bag!" : "Add to Bag"}</span>
            </button>
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className={`w-full rounded-lg font-semibold flex items-center justify-center gap-1 border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-brand-cream transition-colors duration-150 shadow-xs ${
                isMedium ? "py-1.5 sm:py-2 text-[11px] sm:text-xs" : "py-2.5 text-xs gap-1.5"
              }`}
            >
              <span>Select Options</span>
              <ArrowRight className={isMedium ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
