"use client";

import * as React from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MobileStickyBarProps {
  productName: string;
  price: number;
  image: string;
  selectedSize: string;
  selectedColor: string;
  isAvailable: boolean;
  onAddToCart: () => void;
  mainButtonId?: string;
}

export function MobileStickyBar({
  productName,
  price,
  image,
  selectedSize,
  selectedColor,
  isAvailable,
  onAddToCart,
  mainButtonId = "main-add-to-cart",
}: MobileStickyBarProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const target = document.getElementById(mainButtonId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when the main button has scrolled out of view above the viewport
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [mainButtonId]);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Quick add to bag"
      className="border-brand-border animate-in slide-in-from-bottom fixed inset-x-0 bottom-0 z-40 block border-t bg-white/95 px-4 py-3 font-sans shadow-2xl backdrop-blur-md duration-300 md:hidden"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Product preview */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="border-brand-border bg-brand-light relative h-11 w-9 shrink-0 overflow-hidden rounded-md border">
            <Image src={image} alt={productName} fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-brand-dark truncate text-xs font-semibold">{productName}</p>
            <div className="text-brand-muted flex items-center gap-1.5 text-[11px]">
              <span className="text-brand-dark font-semibold">{formatCurrency(price)}</span>
              {(selectedColor || selectedSize) && (
                <>
                  <span>&bull;</span>
                  <span className="truncate">
                    {[selectedColor, selectedSize].filter(Boolean).join(" / ")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action CTA */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!isAvailable}
          className="bg-brand-dark text-brand-cream hover:bg-brand-accent flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>{isAvailable ? "Add to Bag" : "Out of Stock"}</span>
        </button>
      </div>
    </aside>
  );
}
