"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingBag,
  Zap,
  MessageCircle,
  ShieldCheck,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import type { ProductDetailItem } from "../types";
import { getProductFestiveShippingBadge } from "../types";
import type { ShippingPolicySetting } from "@/features/settings/types";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/features/cart";
import { ProductGallery } from "./product-gallery";
import { SizeGuideModal } from "./size-guide-modal";
import { PincodeChecker } from "./pincode-checker";
import { ProductAccordion } from "./product-accordion";
import { MobileStickyBar } from "./mobile-sticky-bar";
import { ProductReviewsSection } from "@/features/reviews/components/product-reviews-section";
import { trackViewItem, trackAddToCart } from "@/features/analytics";
import { env } from "@/lib/env";

interface ProductDetailViewProps {
  product: ProductDetailItem;
  freeShippingThreshold?: number;
  returnWindowDays?: number;
  returnsShortSummary?: string;
  whatsappNumber: string;
  festivePolicy?: ShippingPolicySetting | null;
}

export function ProductDetailView({
  product,
  freeShippingThreshold = 999, // Placeholder default — MUST be confirmed with client before launch
  returnWindowDays = 7, // Placeholder default — MUST be confirmed with client before launch
  returnsShortSummary,
  whatsappNumber,
  festivePolicy,
}: ProductDetailViewProps) {
  const router = useRouter();
  const addItemToCart = useCartStore((state) => state.addItem);

  const festiveBadge = getProductFestiveShippingBadge(product, festivePolicy);

  // Product Type Detection
  const hasVariants = product.has_variants !== false && (product.variants?.length ?? 0) > 0;
  const hasSizeVariants = Boolean(hasVariants && product.variants?.some((v) => Boolean(v.size)));
  const hasColorVariants = Boolean(hasVariants && product.variants?.some((v) => Boolean(v.color)));

  // 1. Color State
  const initialColor = hasColorVariants && product.colors && product.colors.length > 0 ? product.colors[0].color : "";
  const [selectedColor, setSelectedColor] = React.useState<string>(initialColor);

  // 2. Sizes available for the selected color
  const colorVariants = React.useMemo(() => {
    if (!hasVariants) return [];
    if (!selectedColor) return product.variants;
    return product.variants.filter((v) => v.color.toLowerCase() === selectedColor.toLowerCase());
  }, [hasVariants, product.variants, selectedColor]);

  // Initial size: pick the first in-stock size for this color, or the first size
  const firstInStockSize = hasSizeVariants
    ? colorVariants.find((v) => v.stock_quantity > 0)?.size ||
      (colorVariants[0]?.size ?? product.sizes[0] ?? "")
    : "";

  const [selectedSize, setSelectedSize] = React.useState<string>(firstInStockSize);

  // URL sync helper: updates query params using window.history.replaceState (no router navigation, no server round trip)
  const syncVariantUrl = React.useCallback((color?: string, size?: string) => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (color) url.searchParams.set("color", color);
      else url.searchParams.delete("color");
      if (size) url.searchParams.set("size", size);
      else url.searchParams.delete("size");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Safe no-op in non-browser contexts
    }
  }, []);

  // Sync from initial URL query params on mount on client only (keeps SSR/ISR completely static)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlColor = sp.get("color");
      const urlSize = sp.get("size");
      if (urlColor && product.colors?.some((c) => c.color.toLowerCase() === urlColor.toLowerCase())) {
        setSelectedColor(urlColor);
      }
      if (urlSize && product.sizes?.includes(urlSize)) {
        setSelectedSize(urlSize);
      }
    } catch {
      // Safe no-op
    }
  }, [product.colors, product.sizes]);

  const handleColorSelect = (newColor: string) => {
    setSelectedColor(newColor);
    syncVariantUrl(newColor, selectedSize);
  };

  const handleSizeSelect = (newSize: string) => {
    setSelectedSize(newSize);
    syncVariantUrl(selectedColor, newSize);
  };

  // Update selected size when color changes if the current size is out of stock in new color
  const [prevColor, setPrevColor] = React.useState(selectedColor);
  if (prevColor !== selectedColor) {
    setPrevColor(selectedColor);
    if (hasSizeVariants) {
      const currentVariant = colorVariants.find((v) => v.size === selectedSize);
      if (!currentVariant || currentVariant.stock_quantity <= 0) {
        const available = colorVariants.find((v) => v.stock_quantity > 0);
        if (available) {
          setSelectedSize(available.size);
          syncVariantUrl(selectedColor, available.size);
        }
      }
    }
  }

  // 3. Find active variant item (null for simple products)
  const selectedVariant = React.useMemo(() => {
    if (!hasVariants) return null;
    const match = colorVariants.find((v) => v.size === selectedSize);
    return match || colorVariants[0] || product.variants[0] || null;
  }, [hasVariants, colorVariants, selectedSize, product.variants]);

  const maxStock = hasVariants
    ? selectedVariant ? Math.max(0, selectedVariant.stock_quantity) : 0
    : Math.max(0, product.stock_quantity ?? product.total_stock ?? 0);
  const isAvailable = maxStock > 0;

  // 4. Quantity state
  const [quantity, setQuantity] = React.useState(1);

  // Reset quantity to 1 if variant changes
  const [prevVariantId, setPrevVariantId] = React.useState(selectedVariant?.id);
  if (prevVariantId !== selectedVariant?.id) {
    setPrevVariantId(selectedVariant?.id);
    setQuantity(1);
  }

  // 5. Expandable description toggle
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // 6. Size guide modal toggle
  const [isSizeGuideOpen, setIsSizeGuideOpen] = React.useState(false);

  // 7. Pricing calculations
  const price = selectedVariant?.price_override ?? product.base_price;
  const compareAtPrice = product.compare_at_price;
  const isSale = Boolean(compareAtPrice && compareAtPrice > price);
  const discountPercentage = isSale
    ? Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100)
    : null;

  // Track product view (fires once on mount / product change if consent is granted)
  React.useEffect(() => {
    trackViewItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      category: product.category_id || undefined,
      price: product.base_price,
      compareAtPrice: product.compare_at_price,
    });
  }, [product.id, product.name, product.category_id, product.base_price, product.compare_at_price, selectedVariant?.id]);

  // 8. Add to cart handler
  const handleAddToCart = () => {
    if (!isAvailable) return;
    if (hasVariants && !selectedVariant) return;

    const primaryImg =
      (selectedColor &&
        product.images.find(
          (img) => img.color?.toLowerCase() === selectedColor.toLowerCase()
        )?.image_url) ||
      (selectedVariant &&
        product.images.find((img) => img.variant_id === selectedVariant.id)?.image_url) ||
      product.images[0]?.image_url ||
      "/placeholder.jpg";

    addItemToCart(
      {
        productId: product.id,
        variantId: selectedVariant?.id || null,
        title: product.name,
        slug: product.slug,
        size: selectedVariant?.size || null,
        color: selectedVariant?.color || null,
        colorHex: selectedVariant?.color_hex || undefined,
        price,
        compareAtPrice: product.compare_at_price,
        image: primaryImg,
        maxStock,
        freeShippingActive: product.free_shipping_active,
        freeShippingStart: product.free_shipping_start,
        freeShippingEnd: product.free_shipping_end,
        freeShippingBadgeText: product.free_shipping_badge_text,
        isReturnable: product.is_returnable !== false,
        returnOverrideNote: product.return_override_note || null,
      },
      quantity
    );

    // E-commerce analytics tracking (consent-gated)
    trackAddToCart({
      productId: product.id,
      variantId: selectedVariant?.id || undefined,
      name: product.name,
      category: product.category_id || undefined,
      price,
      quantity,
      size: selectedVariant?.size || undefined,
      color: selectedVariant?.color || undefined,
    });
  };

  // 9. Buy now handler
  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  // 10. WhatsApp enquiry link
  const siteUrl = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const whatsappQuery = hasVariants
    ? `Hi Velaash! I am interested in ordering "${product.name}" (${productUrl})${selectedColor ? ` in ${selectedColor}` : ""}${selectedSize ? `, size ${selectedSize}` : ""}. Could you share availability and delivery details?`
    : `Hi Velaash! I am interested in ordering "${product.name}" (${productUrl}). Could you share availability and delivery details?`;
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappQuery)}`
    : "/contact";

  return (
    <div className="space-y-12">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumbs"
        className="text-brand-muted flex items-center gap-1.5 font-sans text-xs"
      >
        <Link href="/" className="hover:text-brand-accent transition-colors">
          Home
        </Link>
        <ChevronRight className="text-brand-border h-3 w-3" />
        {product.category_slug && product.category_name ? (
          <>
            <Link
              href={`/category/${product.category_slug}`}
              className="hover:text-brand-accent transition-colors"
            >
              {product.category_name}
            </Link>
            <ChevronRight className="text-brand-border h-3 w-3" />
          </>
        ) : (
          <>
            <Link href="/shop" className="hover:text-brand-accent transition-colors">
              Shop
            </Link>
            <ChevronRight className="text-brand-border h-3 w-3" />
          </>
        )}
        <span className="text-brand-dark max-w-[200px] truncate font-medium sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* 2. Main PDP Grid: Gallery (Left) & Info Panel (Right) - 42/58 Desktop Split */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-5">
          <ProductGallery
            allImages={product.images}
            selectedColor={selectedColor}
            productName={product.name}
            isSale={isSale}
            discountPercentage={discountPercentage}
            isNew={product.is_new}
          />
        </div>

        {/* Right Column: Product Info Panel */}
        <div className="space-y-6 font-sans lg:col-span-7">
          {/* Category Subtitle & Title */}
          <div className="space-y-1.5">
            {product.category_name && (
              <span className="text-brand-accent-dark text-[11px] font-semibold tracking-widest uppercase">
                {product.category_name}
              </span>
            )}
            <h1 className="font-heading text-brand-dark text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>
          </div>

          {/* Star Rating & Review Link (Omitted if 0 reviews) */}
          {product.rating && product.rating.count > 0 && (
            <button
              type="button"
              onClick={() => {
                document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center gap-2 text-left focus:outline-none"
            >
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(product.rating!.average)
                        ? "fill-amber-400"
                        : "fill-brand-border text-brand-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-brand-dark group-hover:text-brand-accent text-xs font-semibold transition-colors group-hover:underline">
                {product.rating.average.toFixed(1)} ({product.rating.count} reviews)
              </span>
            </button>
          )}

          {/* Pricing Row */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-heading text-brand-dark text-3xl font-bold">
              {formatCurrency(price)}
            </span>
            {isSale && compareAtPrice && (
              <>
                <span className="text-brand-subtle text-base line-through">
                  {formatCurrency(compareAtPrice)}
                </span>
                <span className="bg-brand-rose/15 text-brand-rose rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {discountPercentage}% OFF
                </span>
              </>
            )}
            <div className="text-brand-muted w-full text-[11px]">
              Inclusive of all taxes & duties &bull; Free shipping over {formatCurrency(freeShippingThreshold)}
            </div>

            {/* Promotional / Festive Free Delivery Badge */}
            {festiveBadge && (
              <div className="w-full mt-2.5 overflow-hidden rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/80 p-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-800 ring-1 ring-emerald-600/25">
                    <Sparkles className="h-4 w-4 animate-pulse text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold tracking-tight text-emerald-950 sm:text-[13px]">
                        {festiveBadge}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-700/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-700/20">
                        Zero Delivery Fee
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-emerald-900/85">
                      Standard home delivery is free on this item during this promotional celebration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Description (Rich Text & Plain Text Support) */}
          {product.description && (() => {
            const isHtml = /<[a-z][\s\S]*>/i.test(product.description);
            const cleanText = product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            const isLong = cleanText.length > 200;

            return (
              <div className="text-brand-muted text-xs leading-relaxed sm:text-sm">
                <div
                  className={`relative transition-all duration-300 ${
                    !isDescriptionExpanded && isLong ? "max-h-24 overflow-hidden" : ""
                  }`}
                >
                  {isHtml ? (
                    <div
                      className="prose prose-sm font-sans text-brand-muted max-w-none leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-brand-dark [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:text-brand-dark [&_h2]:text-brand-dark [&_h3]:text-brand-dark"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {!isDescriptionExpanded && isLong && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}
                </div>

                {isLong && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="text-brand-dark hover:text-brand-accent mt-2 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {isDescriptionExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            );
          })()}

          <div className="border-brand-border/60 space-y-5 border-t pt-5">
            {/* Color Selector */}
            {hasColorVariants && product.colors && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-dark font-semibold">
                    Color: <span className="text-brand-muted font-normal">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = c.color.toLowerCase() === selectedColor.toLowerCase();
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => handleColorSelect(c.color)}
                        className={`group relative flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
                          isSelected
                            ? "border-brand-dark bg-brand-dark text-white shadow-xs"
                            : "border-brand-border text-brand-dark hover:border-brand-dark/60 bg-white"
                        }`}
                        title={c.color}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: c.color_hex || "#ccc" }}
                        />
                        <span>{c.color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector + Size Guide Link */}
            {hasSizeVariants && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-dark font-semibold">
                    Select Size:{" "}
                    <span className="text-brand-muted font-normal">{selectedSize}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-brand-accent flex items-center gap-1 font-semibold underline-offset-2 transition-colors hover:underline"
                    >
                      <Sparkles className="text-brand-accent h-3 w-3" />
                      Size Guide
                    </button>
                    <span className="text-brand-border text-xs">&bull;</span>
                    <Link
                      href="/size-guide"
                      className="text-brand-muted hover:text-brand-dark text-xs underline underline-offset-2 transition-colors"
                    >
                      View full size guide
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const variantForSize = colorVariants.find((v) => v.size === size);
                    const isStocked = variantForSize ? variantForSize.stock_quantity > 0 : false;
                    const isSelected = size === selectedSize;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeSelect(size)}
                        className={`relative min-w-[50px] rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-brand-dark bg-brand-dark text-white shadow-xs"
                            : isStocked
                              ? "border-brand-border text-brand-dark hover:border-brand-dark hover:bg-brand-light/20 bg-white"
                              : "border-brand-border/60 bg-brand-light/30 text-brand-subtle cursor-pointer line-through"
                        }`}
                        title={!isStocked ? "Currently out of stock in this color" : undefined}
                      >
                        {size}
                        {!isStocked && <span className="sr-only"> (Out of stock)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock availability indicator */}
            <div className="pt-0.5">
              {isAvailable ? (
                maxStock <= 5 ? (
                  <span className="text-[11px] font-semibold text-amber-700">
                    Only {maxStock} left in stock{hasVariants && selectedColor && selectedSize ? ` for ${selectedColor} • Size ${selectedSize}` : ""}!
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-700">
                    ✓ In Stock and ready to dispatch
                  </span>
                )
              ) : (
                <span className="text-[11px] font-semibold text-rose-700">
                  {hasVariants && selectedColor && selectedSize
                    ? `Out of stock in ${selectedColor} (${selectedSize}). Try another color or check back soon.`
                    : "Currently out of stock. Check back soon."}
                </span>
              )}
            </div>

            {/* Quantity Stepper */}
            {isAvailable && (
              <div className="space-y-1.5">
                <span className="text-brand-dark text-xs font-semibold">Quantity:</span>
                <div className="flex items-center gap-3">
                  <div className="border-brand-border flex items-center rounded-lg border bg-white">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="text-brand-dark hover:bg-brand-light/60 rounded-l-lg p-2 transition-colors disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-brand-dark w-10 text-center text-xs font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= Math.min(maxStock, 10)}
                      onClick={() => setQuantity((prev) => Math.min(prev + 1, maxStock, 10))}
                      className="text-brand-dark hover:bg-brand-light/60 rounded-r-lg p-2 transition-colors disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-brand-muted text-[11px]">
                    (Max {Math.min(maxStock, 10)} per order)
                  </span>
                </div>
              </div>
            )}

            {/* Primary Action Buttons: Add to Cart & Buy Now */}
            <div className="space-y-2.5 pt-2">
              <button
                id="main-add-to-cart"
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className="bg-brand-dark text-brand-cream hover:bg-brand-accent disabled:hover:bg-brand-dark flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{isAvailable ? "Add to Bag" : "Currently Out of Stock"}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className="border-brand-dark text-brand-dark hover:bg-brand-light/40 flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              >
                <Zap className="text-brand-accent fill-brand-accent h-4 w-4" />
                <span>Buy Now with 1-Click</span>
              </button>
            </div>

            {/* WhatsApp Enquiry Button */}
            <div>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100/60"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Ask about this product on WhatsApp</span>
              </a>
            </div>

            {/* Delivery Pincode Checker */}

            <PincodeChecker freeShippingThreshold={freeShippingThreshold} />

            {/* Trust Badges Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border-brand-border/60 text-brand-muted flex items-center gap-2 rounded-lg border bg-white p-2.5 text-[11px]">
                <ShieldCheck className="text-brand-accent h-4 w-4 shrink-0" />
                <span>Quality Checked</span>
              </div>
              {product.is_returnable === false ? (
                <div className="border-amber-200 bg-amber-50/80 text-amber-900 flex items-center gap-2 rounded-lg border p-2.5 text-[11px] font-medium shadow-2xs">
                  <ShieldAlert className="text-amber-700 h-4 w-4 shrink-0" />
                  <span>Final Sale (Non-Returnable)</span>
                </div>
              ) : (
                <div className="border-brand-border/60 text-brand-muted flex items-center gap-2 rounded-lg border bg-white p-2.5 text-[11px]">
                  <RotateCcw className="text-brand-accent h-4 w-4 shrink-0" />
                  <span>{`${returnWindowDays}-Day Replacement`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Details Accordion (Below the fold) */}
      <div className="pt-6">
        <ProductAccordion
          product={product}
          freeShippingThreshold={freeShippingThreshold}
          returnWindowDays={returnWindowDays}
          returnsShortSummary={returnsShortSummary}
        />
      </div>

      {/* 4. Reviews Section */}
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        breakdown={product.reviews_breakdown}
        initialReviews={product.reviews}
      />

      {/* 5. Size Guide Modal (Only rendered when product has size variants) */}
      {hasSizeVariants && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          sizeChart={product.size_chart}
          productName={product.name}
        />
      )}

      {/* 6. Mobile Sticky Add to Cart Bar */}
      <MobileStickyBar
        productName={product.name}
        price={price}
        image={
          product.images.find(
            (img) => selectedColor && img.color?.toLowerCase() === selectedColor.toLowerCase()
          )?.image_url ||
          product.images[0]?.image_url ||
          "/placeholder.jpg"
        }
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        isAvailable={isAvailable}
        onAddToCart={handleAddToCart}
        mainButtonId="main-add-to-cart"
      />
    </div>
  );
}
