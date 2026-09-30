"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import { useCartStore } from "../store/cart-store";

export function CartToast() {
  const isToastVisible = useCartStore((state) => state.isToastVisible);
  const lastAddedItem = useCartStore((state) => state.lastAddedItem);
  const dismissToast = useCartStore((state) => state.dismissToast);

  // Auto-dismiss after 4.5 seconds
  React.useEffect(() => {
    if (!isToastVisible) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [isToastVisible, dismissToast]);

  if (!isToastVisible || !lastAddedItem) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-brand-gold/30 shadow-luxury animate-in fade-in slide-in-from-bottom-5 fixed right-6 bottom-6 z-50 w-[calc(100vw-3rem)] max-w-sm rounded-xl border bg-white/95 p-4 font-sans backdrop-blur-md transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        {/* Success checkmark badge */}
        <div className="bg-brand-accent/15 text-brand-accent mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <Check className="h-3.5 w-3.5" />
        </div>

        {/* Thumbnail preview */}
        <div className="border-brand-border bg-brand-light relative h-14 w-12 shrink-0 overflow-hidden rounded-md border">
          <Image
            src={lastAddedItem.image}
            alt={lastAddedItem.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>

        {/* Item details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-brand-accent text-[11px] font-semibold tracking-wider uppercase">
              Added to Bag
            </span>
            <button
              type="button"
              onClick={dismissToast}
              className="text-brand-muted hover:text-brand-dark transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="font-heading text-brand-dark truncate text-sm font-semibold">
            {lastAddedItem.title}
          </p>

          <p className="text-brand-muted text-xs">
            {lastAddedItem.color} &bull; Size {lastAddedItem.size} &bull; Qty{" "}
            {lastAddedItem.quantity}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <Link
              href="/cart"
              onClick={dismissToast}
              className="text-brand-dark hover:text-brand-accent flex items-center gap-1 text-xs font-semibold underline underline-offset-4 transition-colors"
            >
              View Bag
              <ArrowRight className="h-3 w-3" />
            </Link>
            <span className="text-brand-border">&bull;</span>
            <Link
              href="/checkout"
              onClick={dismissToast}
              className="bg-brand-dark text-brand-cream hover:bg-brand-accent rounded-sm px-2.5 py-1 text-[11px] font-semibold transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
