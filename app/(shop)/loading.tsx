import * as React from "react";
import { ProductGridSkeleton } from "@/features/products";

export default function ShopLoading() {
  return (
    <div className="space-y-8 font-sans">
      {/* Header skeleton */}
      <div className="border-brand-border/60 animate-pulse space-y-2 border-b pb-6">
        <div className="h-4 w-32 rounded-sm bg-neutral-200" />
        <div className="h-8 w-64 rounded-md bg-neutral-200" />
        <div className="h-4 w-96 rounded-sm bg-neutral-200/70" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
        <div className="hidden space-y-4 md:block">
          <div className="h-40 rounded-xl bg-neutral-200/50" />
          <div className="h-40 rounded-xl bg-neutral-200/50" />
        </div>
        <div className="md:col-span-3 lg:col-span-4">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
