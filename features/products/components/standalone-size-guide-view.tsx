"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ruler,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import type { CategorySizeChartItem } from "../queries/get-all-category-size-charts";
import { SizeChartTable } from "./size-chart-table";

interface StandaloneSizeGuideViewProps {
  categories: CategorySizeChartItem[];
}

export function StandaloneSizeGuideView({ categories }: StandaloneSizeGuideViewProps) {
  const [selectedId, setSelectedId] = React.useState<string>(
    categories[0]?.id || ""
  );

  const activeChart =
    categories.find((c) => c.id === selectedId) || categories[0];

  const whatsappNumber = "918508643832";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello Velaash, I have a question regarding size selection and garment fit for ${activeChart?.categoryName || "your collection"}.`
  )}`;

  return (
    <div className="space-y-12">
      {/* Category Tabs Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-brand-dark font-sans text-xs font-semibold tracking-wider uppercase">
            Select Apparel Category
          </span>
          <span className="text-brand-muted text-xs">
            Showing {categories.length} category guides
          </span>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-brand-border/60 pb-5">
          {categories.map((cat) => {
            const isSelected = cat.id === activeChart?.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedId(cat.id)}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-brand-dark text-white shadow-sm ring-2 ring-brand-dark/20"
                    : "bg-white text-brand-dark border border-brand-border hover:border-brand-dark/50 hover:bg-brand-light/30"
                }`}
              >
                {cat.categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Size Chart Card */}
      {activeChart && (
        <section
          aria-labelledby="active-chart-heading"
          className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ruler className="text-brand-accent h-4 w-4" />
                <span className="text-brand-accent-dark text-[11px] font-semibold tracking-widest uppercase">
                  {activeChart.categoryName}
                </span>
              </div>
              <h2
                id="active-chart-heading"
                className="font-heading text-2xl sm:text-3xl font-semibold text-brand-dark"
              >
                {activeChart.name}
              </h2>
              <p className="text-xs text-brand-muted">
                Standard garment specifications for {activeChart.categoryName}. All measurements are taken flat.
              </p>
            </div>

            {activeChart.categorySlug && (
              <Link
                href={`/shop`}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-brand-border bg-brand-cream/40 px-3.5 py-1.5 text-xs font-semibold text-brand-dark transition-colors hover:border-brand-dark hover:bg-brand-cream"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-brand-accent" />
                Browse {activeChart.categoryName}
              </Link>
            )}
          </div>

          {/* Reused Size Chart Table Component */}
          <SizeChartTable
            headers={activeChart.headers}
            rows={activeChart.rows}
            tips={activeChart.tips}
            defaultUnit={activeChart.measurementUnit}
            showTips={true}
          />
        </section>
      )}

      {/* Global Measuring Guidance & Fit Philosophy */}
      <section
        aria-labelledby="measuring-guide-heading"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
      >
        {/* Step-by-Step Instructions */}
        <div className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Scissors className="text-brand-accent h-5 w-5" />
            <h3
              id="measuring-guide-heading"
              className="font-heading text-lg font-semibold text-brand-dark"
            >
              How to Take Accurate Measurements
            </h3>
          </div>
          <p className="text-xs text-brand-muted leading-relaxed">
            For the most flattering silhouette, measure yourself wearing fitted innerwear with a soft, flexible measuring tape. Keep the tape parallel to the floor and snug without pinching.
          </p>

          <div className="space-y-3 pt-2 text-xs text-brand-muted">
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-[11px] text-brand-dark">
                1
              </span>
              <div>
                <strong className="text-brand-dark block">Bust / Chest:</strong>
                <span>Pass the measuring tape under your arms and around the fullest part of your bustline. Breathe normally.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-[11px] text-brand-dark">
                2
              </span>
              <div>
                <strong className="text-brand-dark block">Natural Waist:</strong>
                <span>Measure around your natural waistline, usually 1 to 2 inches above your navel at the narrowest indentation.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-[11px] text-brand-dark">
                3
              </span>
              <div>
                <strong className="text-brand-dark block">Hips:</strong>
                <span>Stand with your heels together and measure around the widest, fullest contour of your hips and rear.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-[11px] text-brand-dark">
                4
              </span>
              <div>
                <strong className="text-brand-dark block">Garment Length:</strong>
                <span>Measured vertically from the highest shoulder seam down along the front torso to the finished hemline.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fit Principles & Sizing Advice */}
        <div className="rounded-2xl border border-brand-border/80 bg-brand-cream/30 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-brand-accent h-5 w-5" />
              <h3 className="font-heading text-lg font-semibold text-brand-dark">
                Fit & Silhouette Advice
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs text-brand-muted leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong className="text-brand-dark">Garment Dimensions vs. Body Dimensions:</strong> Size chart numbers represent the garment&apos;s finished measurements. Most ethnic kurtas and tunics include 2 to 3 inches of built-in ease for comfortable movement.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong className="text-brand-dark">Between Sizes?</strong> If your measurements fall between two sizes, we recommend choosing the larger size for a relaxed drape, or the smaller size for a tailored fit.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong className="text-brand-dark">Free Size &amp; Elasticated Waists:</strong> Garments designated as Free Size or featuring elasticated waistbands comfortably accommodate a range of waist profiles.
                </span>
              </li>
            </ul>
          </div>

          {/* WhatsApp Consultation Prompt */}
          <div className="rounded-xl border border-brand-border/60 bg-white p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>Still unsure about your size?</span>
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Send us your height and measurements on WhatsApp. Our styling advisors will help guide your selection before you place your order.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 transition-colors"
            >
              Chat on WhatsApp for sizing advice &rarr;
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
