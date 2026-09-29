import * as React from "react";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="bg-brand-cream/30 border-brand-border/40 flex animate-pulse flex-col overflow-hidden rounded-xl border"
        >
          {/* Image Aspect Ratio Skeleton */}
          <div className="aspect-[3/4] w-full bg-neutral-200/70" />

          {/* Details Skeleton */}
          <div className="space-y-2 p-3 sm:p-4">
            <div className="h-3 w-16 rounded-sm bg-neutral-200" />
            <div className="h-4 w-3/4 rounded-sm bg-neutral-200" />
            <div className="flex items-center gap-2 pt-1">
              <div className="h-4 w-14 rounded-sm bg-neutral-200" />
              <div className="h-3 w-10 rounded-sm bg-neutral-200/50" />
            </div>
            <div className="flex gap-1.5 pt-1">
              <div className="h-3.5 w-3.5 rounded-full bg-neutral-200" />
              <div className="h-3.5 w-3.5 rounded-full bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
