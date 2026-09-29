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
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import type { ProductDetailItem } from "../types";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/features/cart";
import { ProductGallery } from "./product-gallery";
import { SizeGuideModal } from "./size-guide-modal";
import { PincodeChecker } from "./pincode-checker";
import { ProductAccordion } from "./product-accordion";
import { MobileStickyBar } from "./mobile-sticky-bar";
import { ProductReviewsSection } from "@/features/reviews/components/product-reviews-section";

interface ProductDetailViewProps {
  product: ProductDetailItem;
  freeShippingThreshold?: number;
  returnWindowDays?: number;
}

export function ProductDetailView({
  product,
  freeShippingThreshold = 999, // Placeholder default — MUST be confirmed with client before launch
  returnWindowDays = 7, // Placeholder default — MUST be confirmed with client before launch
}: ProductDetailViewProps) {
  const router = useRouter();
  const addItemToCart = useCartStore((state) => state.addItem);

  // 1. Color State
  const initialColor = product.colors && product.colors.length > 0 ? product.colors[0].color : "";
  const [selectedColor, setSelectedColor] = React.useState<string>(initialColor);

  // 2. Sizes available for the selected color
  const colorVariants = React.useMemo(() => {
    if (!selectedColor) return product.variants;
    return product.variants.filter((v) => v.color.toLowerCase() === selectedColor.toLowerCase());
  }, [product.variants, selectedColor]);

  // Initial size: pick the first in-stock size for this color, or the first size
  const firstInStockSize =
    colorVariants.find((v) => v.stock_quantity > 0)?.size ||
    (colorVariants[0]?.size ?? product.sizes[0] ?? "Free Size");

  const [selectedSize, setSelectedSize] = React.useState<string>(firstInStockSize);

  // Update selected size when color changes if the current size is out of stock in new color
  const [prevColor, setPrevColor] = React.useState(selectedColor);
  if (prevColor !== selectedColor) {
    setPrevColor(selectedColor);
    const currentVariant = colorVariants.find((v) => v.size === selectedSize);
    if (!currentVariant || currentVariant.stock_quantity <= 0) {
      const available = colorVariants.find((v) => v.stock_quantity > 0);
      if (available) {
        setSelectedSize(available.size);
      }
    }
  }

  // 3. Find active variant item
  const selectedVariant = React.useMemo(() => {
    const match = colorVariants.find((v) => v.size === selectedSize);
    return match || colorVariants[0] || product.variants[0];
  }, [colorVariants, selectedSize, product.variants]);

  const maxStock = selectedVariant ? Math.max(0, selectedVariant.stock_quantity) : 0;
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

  // 8. Add to cart handler
  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable) return;

    const primaryImg =
      product.images.find(
        (img) =>
          img.variant_id === selectedVariant.id ||
          (selectedColor && img.color?.toLowerCase() === selectedColor.toLowerCase())
      )?.image_url ||
      product.images[0]?.image_url ||
      "/placeholder.jpg";

    addItemToCart(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        title: product.name,
        slug: product.slug,
        size: selectedVariant.size,
        color: selectedVariant.color,
        colorHex: selectedVariant.color_hex || undefined,
        price,
        compareAtPrice: product.compare_at_price,
        image: primaryImg,
        maxStock,
      },
      quantity
    );
  };

  // 9. Buy now handler
  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  // 10. WhatsApp enquiry link
  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://velaash.com/products/${product.slug}`;
  const whatsappQuery = `Hi Velaash! I am interested in ordering "${product.name}" (${currentUrl}) in ${selectedColor}, size ${selectedSize}. Could you share availability and delivery details?`;
  const whatsappHref = `https://wa.me/918508643832?text=${encodeURIComponent(whatsappQuery)}`;

  return (
    <div className="space-y-12">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumbs"
        className="text-brand-dark/60 flex items-center gap-1.5 font-sans text-xs"
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

      {/* 2. Main PDP Grid: Gallery (Left) & Info Panel (Right) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7">
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
        <div className="space-y-6 font-sans lg:col-span-5">
          {/* Category Subtitle & Title */}
          <div className="space-y-1.5">
            {product.category_name && (
              <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
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
                <span className="text-brand-dark/50 text-base line-through">
                  {formatCurrency(compareAtPrice)}
                </span>
                <span className="bg-brand-rose/15 text-brand-rose rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {discountPercentage}% OFF
                </span>
              </>
            )}
            <div className="text-brand-dark/60 w-full text-[11px]">
              Inclusive of all taxes & duties &bull; Free shipping over {formatCurrency(freeShippingThreshold)}
            </div>
          </div>

          {/* Short Description */}
          {product.description && (
            <div className="text-brand-dark/80 text-xs leading-relaxed sm:text-sm">
              <p
                className={
                  !isDescriptionExpanded && product.description.length > 150 ? "line-clamp-2" : ""
                }
              >
                {product.description}
              </p>
              {product.description.length > 150 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                  className="text-brand-dark hover:text-brand-accent mt-1 text-xs font-semibold underline underline-offset-2 transition-colors"
                >
                  {isDescriptionExpanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          )}

          <div className="border-brand-border/60 space-y-5 border-t pt-5">
            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-dark font-semibold">
                    Color: <span className="text-brand-dark/80 font-normal">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = c.color.toLowerCase() === selectedColor.toLowerCase();
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setSelectedColor(c.color)}
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
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-dark font-semibold">
                  Select Size:{" "}
                  <span className="text-brand-dark/80 font-normal">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-brand-accent flex items-center gap-1 font-semibold underline-offset-2 transition-colors hover:underline"
                >
                  <Sparkles className="text-brand-gold h-3 w-3" />
                  Size Guide
                </button>
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
                      onClick={() => setSelectedSize(size)}
                      className={`relative min-w-[50px] rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-brand-dark bg-brand-dark text-white shadow-xs"
                          : isStocked
                            ? "border-brand-border text-brand-dark hover:border-brand-dark hover:bg-brand-light/20 bg-white"
                            : "border-brand-border/60 bg-brand-light/30 text-brand-dark/40 cursor-pointer line-through"
                      }`}
                      title={!isStocked ? "Currently out of stock in this color" : undefined}
                    >
                      {size}
                      {!isStocked && <span className="sr-only"> (Out of stock)</span>}
                    </button>
                  );
                })}
              </div>

              {/* Stock availability indicator */}
              <div className="pt-0.5">
                {isAvailable ? (
                  maxStock <= 5 ? (
                    <span className="text-[11px] font-semibold text-amber-700">
                      Only {maxStock} left in stock for {selectedColor} &bull; Size {selectedSize}!
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-700">
                      ✓ In Stock and ready to dispatch
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-semibold text-rose-700">
                    Out of stock in {selectedColor} ({selectedSize}). Try another color or check
                    back soon.
                  </span>
                )}
              </div>
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
                  <span className="text-brand-dark/50 text-[11px]">
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
                <Zap className="text-brand-gold fill-brand-gold h-4 w-4" />
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
              <div className="border-brand-border/60 text-brand-dark/80 flex items-center gap-2 rounded-lg border bg-white p-2.5 text-[11px]">
                <ShieldCheck className="text-brand-gold h-4 w-4 shrink-0" />
                <span>Quality Checked</span>
              </div>
              <div className="border-brand-border/60 text-brand-dark/80 flex items-center gap-2 rounded-lg border bg-white p-2.5 text-[11px]">
                <RotateCcw className="text-brand-gold h-4 w-4 shrink-0" />
                <span>{`${returnWindowDays}-Day Returns`}</span>
              </div>
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

      {/* 5. Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        sizeChart={product.size_chart}
        productName={product.name}
      />

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
