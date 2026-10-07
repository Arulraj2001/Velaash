"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Sparkles, Truck, Ruler, SlidersHorizontal, ShieldAlert } from "lucide-react";
import type { ProductDetailItem } from "../types";
import { formatCurrency } from "@/lib/utils";

interface ProductAccordionProps {
  product: ProductDetailItem;
  freeShippingThreshold?: number;
  returnWindowDays?: number;
  returnsShortSummary?: string;
}

export function ProductAccordion({
  product,
  freeShippingThreshold = 999, // Placeholder default — MUST be confirmed with client before launch
  returnWindowDays = 7, // Placeholder default — MUST be confirmed with client before launch
  returnsShortSummary,
}: ProductAccordionProps) {
  const hasDetails = Boolean(
    product.fabric || product.craftsmanship || product.care_instructions || product.hsn_code
  );
  const hasSpecifications = Boolean(
    product.specifications && product.specifications.length > 0
  );
  const hasSizeVariants = Boolean(
    product.has_variants !== false && product.variants?.some((v) => Boolean(v.size))
  );

  // First available informative section open by default
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    details: hasDetails,
    specifications: !hasDetails && hasSpecifications,
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
      {hasDetails && (
        <div>
          <button
            type="button"
            onClick={() => toggleSection("details")}
            aria-expanded={openSections.details}
            className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              <span className="font-heading text-lg font-semibold text-brand-dark">
                Product Details
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-brand-muted transition-transform duration-200 ${
                openSections.details ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.details && (
            <div className="space-y-4 pb-5 pt-1 text-xs sm:text-sm text-brand-muted leading-relaxed animate-in fade-in duration-200">
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
                <div className="text-[11px] text-brand-muted">
                  HSN Code: {product.hsn_code} &bull; GST: {product.gst_rate ?? 5}% included
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Specifications Table (Only rendered when specifications exist) */}
      {hasSpecifications && product.specifications && (
        <div>
          <button
            type="button"
            onClick={() => toggleSection("specifications")}
            aria-expanded={openSections.specifications}
            className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-4 w-4 text-brand-accent" />
              <span className="font-heading text-lg font-semibold text-brand-dark">
                Specifications
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-brand-muted transition-transform duration-200 ${
                openSections.specifications ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.specifications && (
            <div className="pb-5 pt-1 animate-in fade-in duration-200">
              <div className="overflow-hidden rounded-lg border border-brand-border/60 bg-white">
                <table className="w-full text-left text-xs sm:text-sm">
                  <tbody className="divide-y divide-brand-border/50">
                    {product.specifications.map((spec, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-brand-cream/30" : "bg-white"}
                      >
                        <td className="w-2/5 py-2.5 px-3.5 font-semibold text-brand-dark border-r border-brand-border/40">
                          {spec.label}
                        </td>
                        <td className="py-2.5 px-3.5 text-brand-muted">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Shipping & Replacements */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("shipping")}
          aria-expanded={openSections.shipping}
          className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-brand-accent" />
            <span className="font-heading text-lg font-semibold text-brand-dark">
              Shipping &amp; Replacements
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-brand-muted transition-transform duration-200 ${
              openSections.shipping ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.shipping && (
          <div className="space-y-3.5 pb-5 pt-1 text-xs sm:text-sm text-brand-muted leading-relaxed animate-in fade-in duration-200">
            <p>
              <strong className="text-brand-dark">Free Shipping: </strong>
              Delivery across India with free shipping on prepaid orders exceeding {formatCurrency(freeShippingThreshold)}.
            </p>
            <p>
              <strong className="text-brand-dark">Dispatch &amp; Delivery: </strong>
              Orders are dispatched via standard domestic courier services. Tracking details are shared via email and SMS upon dispatch.
            </p>

            {product.is_returnable === false ? (
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-3.5 text-xs text-amber-950 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Final Sale Notice (Non-Returnable)</span>
                </div>
                <p className="text-[12px] text-amber-900/90 leading-relaxed pl-6">
                  {product.return_override_note ||
                    "This item is marked as Final Sale and cannot be returned or exchanged once delivered."}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <p>
                  <strong className="text-brand-dark">{`${returnWindowDays}-Day Doorstep Replacement: `}</strong>
                  {returnsShortSummary ||
                    `Doorstep size exchanges and defect replacements are accepted within ${returnWindowDays} days of delivery for unworn items with tags attached and uncut unboxing video.`}
                </p>
                <div className="pt-0.5">
                  <Link
                    href="/shipping-returns"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-gold hover:text-brand-dark transition-colors"
                  >
                    <span>Read full Shipping &amp; Replacements Policy</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Size & Fit Guidance (Only rendered when product has size variants) */}
      {hasSizeVariants && (
        <div>
          <button
            type="button"
            onClick={() => toggleSection("fit")}
            aria-expanded={openSections.fit}
            className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-brand-accent focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Ruler className="h-4 w-4 text-brand-accent" />
              <span className="font-heading text-lg font-semibold text-brand-dark">
                Size & Fit Guidance
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-brand-muted transition-transform duration-200 ${
                openSections.fit ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.fit && (
            <div className="space-y-3 pb-5 pt-1 text-xs sm:text-sm text-brand-muted leading-relaxed animate-in fade-in duration-200">
              <p>
                <strong className="text-brand-dark">Fit: </strong>
                Designed for a standard, comfortable fit. Please consult the Size Guide for detailed garment measurements.
              </p>
              <p>
                <strong className="text-brand-dark">Fit Note: </strong>
                Garments are tailored for an effortless, regular fit. Refer to our Size Guide above for detailed measurements across sizes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
