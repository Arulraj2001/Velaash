"use client";

import * as React from "react";
import { ChevronDown, Sparkles, Truck, Ruler } from "lucide-react";
import type { ProductDetailItem } from "../types";
import { formatCurrency } from "@/lib/utils";

interface ProductAccordionProps {
  product: ProductDetailItem;
  freeShippingThreshold?: number;
  returnWindowDays?: number;
}

export function ProductAccordion({
  product,
  freeShippingThreshold = 999, // Placeholder default — MUST be confirmed with client before launch
  returnWindowDays = 7, // Placeholder default — MUST be confirmed with client before launch
}: ProductAccordionProps) {
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
    <div className="divide-y divide-brand-border/70 border-y border-brand-border/70 font-sans">
      {/* 1. Product Details */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("details")}
          aria-expanded={openSections.details}
          className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-brand-gold" />
            <span className="font-heading text-lg font-semibold text-brand-dark">
              Product Details
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-brand-dark/60 transition-transform duration-200 ${
              openSections.details ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.details && (
          <div className="space-y-4 pb-5 pt-1 text-xs sm:text-sm text-brand-dark/80 leading-relaxed animate-in fade-in duration-200">
            {product.fabric && (
              <div>
                <span className="font-semibold text-brand-dark">Fabric: </span>
                <span>{product.fabric}</span>
              </div>
            )}

            {product.craftsmanship && (
              <div>
                <span className="font-semibold text-brand-dark">Details: </span>
                <span>{product.craftsmanship}</span>
              </div>
            )}

            {product.care_instructions && (
              <div>
                <span className="font-semibold text-brand-dark">Care Instructions: </span>
                <span>{product.care_instructions}</span>
              </div>
            )}

            {product.hsn_code && (
              <div className="text-[11px] text-brand-dark/60">
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
          className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-brand-gold" />
            <span className="font-heading text-lg font-semibold text-brand-dark">
              Shipping & Returns
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-brand-dark/60 transition-transform duration-200 ${
              openSections.shipping ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.shipping && (
          <div className="space-y-3 pb-5 pt-1 text-xs sm:text-sm text-brand-dark/80 leading-relaxed animate-in fade-in duration-200">
            <p>
              <strong className="text-brand-dark">Free Shipping: </strong>
              Delivery across India with free shipping on prepaid orders exceeding {formatCurrency(freeShippingThreshold)}.
            </p>
            <p>
              <strong className="text-brand-dark">Estimated Timelines: </strong>
              Metro locations typically receive shipments in 3 to 5 business days. Other destinations take 5 to 7 business days.
            </p>
            <p>
              <strong className="text-brand-dark">{`${returnWindowDays}-Day Returns: `}</strong>
              Returns and exchanges are accepted within {returnWindowDays} days of delivery for unworn items with tags attached.
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
          className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Ruler className="h-4 w-4 text-brand-gold" />
            <span className="font-heading text-lg font-semibold text-brand-dark">
              Size & Fit Guidance
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-brand-dark/60 transition-transform duration-200 ${
              openSections.fit ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.fit && (
          <div className="space-y-3 pb-5 pt-1 text-xs sm:text-sm text-brand-dark/80 leading-relaxed animate-in fade-in duration-200">
            <p>
              <strong className="text-brand-dark">Fit: </strong>
              Designed for a standard, comfortable fit. Please consult the Size Guide for detailed garment measurements.
            </p>
            <p>
              <strong className="text-brand-dark">Model Measurements: </strong>
              Model is 5&apos;8&quot; wearing size S.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
