import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Ruler } from "lucide-react";
import { getAllCategorySizeCharts } from "@/features/products/queries/get-all-category-size-charts";
import { StandaloneSizeGuideView } from "@/features/products/components/standalone-size-guide-view";

export const metadata: Metadata = {
  title: "Size & Fit Guide | Velaash",
  description:
    "Comprehensive category-level size charts, garment dimensions, and body measurement guidance for Velaash kurtas, dresses, co-ords, tops, bottoms, and loungewear.",
};

export const revalidate = 3600; // Cache for 1 hour

export default async function SizeGuidePage() {
  const categoryCharts = await getAllCategorySizeCharts();

  return (
    <main className="min-h-screen bg-brand-cream/20 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-brand-muted"
        >
          <Link href="/" className="hover:text-brand-dark transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-brand-border" />
          <span className="text-brand-dark font-medium">Size Guide</span>
        </nav>

        {/* Hero Title Section */}
        <header className="space-y-3 text-center sm:text-left border-b border-brand-border/60 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-light/60 border border-brand-border/70 px-3.5 py-1 text-xs font-semibold text-brand-accent-dark">
            <Ruler className="h-3.5 w-3.5 text-brand-accent" />
            <span>Garment Measurements &amp; Fit Standards</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-medium tracking-tight text-brand-dark">
            Velaash Size &amp; Fit Guide
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-brand-muted leading-relaxed">
            Find your ideal silhouette across our apparel collections. Use our interactive category charts to review exact garment dimensions in inches or centimeters, and follow our measurement tips for a flattering fit.
          </p>
        </header>

        {/* Standalone Size Guide View */}
        <StandaloneSizeGuideView categories={categoryCharts} />
      </div>
    </main>
  );
}
