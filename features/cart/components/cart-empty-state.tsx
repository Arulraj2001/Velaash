import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function CartEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Decorative Icon Circle */}
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-cream/80 ring-1 ring-brand-gold/30">
        <div className="absolute inset-0 rounded-full animate-ping opacity-15 bg-brand-gold" />
        <ShoppingBag className="h-10 w-10 text-brand-muted stroke-[1.5]" />
      </div>

      <h1 className="font-heading text-2xl md:text-3xl font-normal text-brand-dark tracking-tight">
        Your Shopping Bag is Empty
      </h1>

      <p className="mt-3 max-w-md text-sm md:text-base text-brand-muted leading-relaxed">
        Looks like you haven&apos;t added any items to your bag yet. Explore our newest arrivals
        and curated essentials for your home and wardrobe.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-none bg-brand-dark px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-cream transition-all duration-300 hover:bg-brand-accent hover:shadow-md"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
