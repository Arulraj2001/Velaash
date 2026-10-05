"use client";

import dynamic from "next/dynamic";

const RecentlyViewedSection = dynamic(
  () =>
    import("@/features/products/components/recently-viewed-section").then(
      (mod) => mod.RecentlyViewedSection
    ),
  { ssr: false }
);

export function DeferredRecentlyViewedSection() {
  return <RecentlyViewedSection />;
}
