"use client";

import * as React from "react";
import { ChevronDown, Sparkles, Truck, Ruler } from "lucide-react";
import type { ProductDetailItem } from "../types";

interface ProductAccordionProps {
  product: ProductDetailItem;
}

export function ProductAccordion({ product }: ProductAccordionProps) {
  // First item open by default
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    details: true,
    shipping: false,
    fit: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="divide-brand-border/70 border-brand-border/70 divide-y border-y font-sans">
      {/* 1. Product Details */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("details")}
          aria-expanded={openSections.details}
          className="hover:text-brand-accent flex w-full items-center justify-between py-4 text-left transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-brand-gold h-4 w-4" />
            <span className="font-heading text-brand-dark text-lg font-semibold">
              Product Details & Craftsmanship
            </span>
          </div>
          <ChevronDown
            className={`text-brand-dark/60 h-4 w-4 transition-transform duration-200 ${
              openSections.details ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.details && (
          <div className="text-brand-dark/80 animate-in fade-in space-y-4 pt-1 pb-5 text-xs leading-relaxed duration-200 sm:text-sm">
            {product.fabric && (
              <div>
                <span className="text-brand-dark font-semibold">Fabric & Composition: </span>
                <span>{product.fabric}</span>
              </div>
            )}

            {product.craftsmanship && (
              <div>
                <span className="text-brand-dark font-semibold">Artisanal Craftsmanship: </span>
                <span>{product.craftsmanship}</span>
              </div>
            )}

            {product.care_instructions && (
              <div>
                <span className="text-brand-dark font-semibold">Wash & Care Instructions: </span>
                <span>{product.care_instructions}</span>
              </div>
            )}

            {product.hsn_code && (
              <div className="text-brand-dark/60 text-[11px]">
                HSN Code: {product.hsn_code} &bull; GST: {product.gst_rate ?? 5}% included
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Shipping & Returns */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("shipping")}
          aria-expanded={openSections.shipping}
          className="hover:text-brand-accent flex w-full items-center justify-between py-4 text-left transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Truck className="text-brand-gold h-4 w-4" />
            <span className="font-heading text-brand-dark text-lg font-semibold">
              Shipping & Easy Returns
            </span>
          </div>
          <ChevronDown
            className={`text-brand-dark/60 h-4 w-4 transition-transform duration-200 ${
              openSections.shipping ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.shipping && (
          <div className="text-brand-dark/80 animate-in fade-in space-y-3 pt-1 pb-5 text-xs leading-relaxed duration-200 sm:text-sm">
            <p>
              <strong className="text-brand-dark">Complimentary Express Shipping: </strong>
              Free delivery across all major Indian cities on all prepaid orders exceeding ₹999.
              Orders are carefully packaged in signature Velaash boutique boxes.
            </p>
            <p>
              <strong className="text-brand-dark">Delivery Timelines: </strong>
              Metro locations typically receive shipments in 3 to 5 business days. Remote or
              regional destinations take 5 to 7 business days.
            </p>
            <p>
              <strong className="text-brand-dark">7-Day Hassle-Free Exchange: </strong>
              We accept size exchanges and returns within 7 calendar days of receipt for items that
              are unused, unaltered, and retained with original designer tags intact.
            </p>
          </div>
        )}
      </div>

      {/* 3. Size & Fit */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("fit")}
          aria-expanded={openSections.fit}
          className="hover:text-brand-accent flex w-full items-center justify-between py-4 text-left transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Ruler className="text-brand-gold h-4 w-4" />
            <span className="font-heading text-brand-dark text-lg font-semibold">
              Size, Silhouette & Fit Guidance
            </span>
          </div>
          <ChevronDown
            className={`text-brand-dark/60 h-4 w-4 transition-transform duration-200 ${
              openSections.fit ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.fit && (
          <div className="text-brand-dark/80 animate-in fade-in space-y-3 pt-1 pb-5 text-xs leading-relaxed duration-200 sm:text-sm">
            <p>
              <strong className="text-brand-dark">Fit Recommendation: </strong>
              This garment is cut in a classic contemporary tailored fit. We advise choosing your
              standard bust measurement for the most flattering drape.
            </p>
            <p>
              <strong className="text-brand-dark">Boutique Seam Allowance: </strong>
              Each side seam is tailored with up to 1.5 inches of extra fabric margin, allowing
              convenient local boutique loosening or custom alterations if desired.
            </p>
            <p>
              <strong className="text-brand-dark">Model Measurements: </strong>
              Our editorial model is 5&apos;8&quot; tall with a 34-inch bust and 28-inch waist,
              wearing size S.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
