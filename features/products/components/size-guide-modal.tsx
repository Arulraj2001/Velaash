"use client";

import * as React from "react";
import Link from "next/link";
import { X, Ruler } from "lucide-react";
import type { SizeChartData } from "../types";
import { SizeChartTable } from "./size-chart-table";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart?: SizeChartData | null;
  productName: string;
}

export function SizeGuideModal({ isOpen, onClose, sizeChart, productName }: SizeGuideModalProps) {
  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const headers = sizeChart?.headers || [
    "Size",
    "Bust (in)",
    "Waist (in)",
    "Hip (in)",
    "Length (in)",
  ];
  const rows = sizeChart?.rows || [];
  const tips = sizeChart?.tips || [
    "Bust: Measure under arms around the fullest part of your bust.",
    "Waist: Measure around your natural waistline, keeping the tape comfortably loose.",
    "Hips: Stand with feet together and measure around fullest part of your hips.",
    "Length: Measured from high shoulder point straight down to hemline.",
    "Measurements are garment dimensions. For a relaxed fit, select one size up.",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="bg-brand-dark/70 fixed inset-0 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="border-brand-border animate-in fade-in zoom-in-95 relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl duration-200 sm:p-8">
        {/* Header */}
        <div className="border-brand-border/60 flex items-start justify-between border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Ruler className="text-brand-accent h-5 w-5" />
              <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
                Size Guide
              </span>
            </div>
            <h2
              id="size-guide-title"
              className="font-heading text-brand-dark text-2xl font-semibold"
            >
              Size Chart & Fit Guide
            </h2>
            <p className="text-brand-muted text-xs">
              Measurements tailored for{" "}
              <span className="text-brand-dark font-medium">{productName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted hover:bg-brand-light/60 hover:text-brand-dark rounded-full p-2 transition-colors"
            aria-label="Close size guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reused Size Chart Table & Measurements */}
        <div className="pt-5">
          <SizeChartTable
            headers={headers}
            rows={rows}
            tips={tips}
            defaultUnit={sizeChart?.measurement_unit || "inches"}
          />
        </div>

        {/* Footer info & Alternate Route Link */}
        <div className="text-brand-muted border-brand-border/60 mt-6 flex flex-col items-center justify-between gap-3 border-t pt-4 text-xs sm:flex-row">
          <div className="flex items-center gap-1.5">
            <span>Looking for other categories?</span>
            <Link
              href="/size-guide"
              onClick={onClose}
              className="text-brand-accent hover:text-brand-dark font-medium underline underline-offset-2 transition-colors"
            >
              View full size guide &rarr;
            </Link>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-dark hover:bg-brand-accent w-full rounded-lg px-5 py-2 text-center font-medium text-white transition-colors sm:w-auto"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

