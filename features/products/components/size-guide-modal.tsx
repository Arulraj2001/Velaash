"use client";

import * as React from "react";
import { X, Ruler, CheckCircle2 } from "lucide-react";
import type { SizeChartData } from "../types";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart?: SizeChartData | null;
  productName: string;
}

export function SizeGuideModal({ isOpen, onClose, sizeChart, productName }: SizeGuideModalProps) {
  const [unit, setUnit] = React.useState<"inches" | "cm">("inches");

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

  // Helper to convert inch string to cm if unit is cm
  const formatValue = (val: string, colIndex: number) => {
    if (colIndex === 0 || unit === "inches") return val;
    // Attempt conversion
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return (num * 2.54).toFixed(1);
    }
    if (val.includes("-")) {
      const parts = val.split("-").map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return `${(parts[0] * 2.54).toFixed(0)}-${(parts[1] * 2.54).toFixed(0)}`;
      }
    }
    return val;
  };

  const displayHeaders = headers.map((h, i) => {
    if (i === 0) return h;
    return unit === "inches" ? h : h.replace(/\(in\)/gi, "(cm)");
  });

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
              <Ruler className="text-brand-gold h-5 w-5" />
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
            <p className="text-brand-dark/70 text-xs">
              Measurements tailored for{" "}
              <span className="text-brand-dark font-medium">{productName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-brand-dark/60 hover:bg-brand-light/60 hover:text-brand-dark rounded-full p-2 transition-colors"
            aria-label="Close size guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unit Selector Toggle */}
        <div className="my-5 flex items-center justify-between">
          <span className="text-brand-dark/70 text-xs font-medium">Measurement Unit:</span>
          <div className="border-brand-border bg-brand-light/30 flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setUnit("inches")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                unit === "inches"
                  ? "text-brand-dark bg-white shadow-xs"
                  : "text-brand-dark/60 hover:text-brand-dark"
              }`}
            >
              Inches (&quot;)
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                unit === "cm"
                  ? "text-brand-dark bg-white shadow-xs"
                  : "text-brand-dark/60 hover:text-brand-dark"
              }`}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Size Chart Table */}
        <div className="border-brand-border/80 overflow-x-auto rounded-xl border">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-brand-light/40 border-brand-border text-brand-dark border-b font-medium">
              <tr>
                {displayHeaders.map((header, idx) => (
                  <th
                    key={header}
                    className={`px-4 py-3 ${idx === 0 ? "text-brand-accent font-bold" : ""}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-brand-border/50 text-brand-dark/80 divide-y">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-brand-cream/30" : "bg-white"}>
                  {headers.map((h, cIdx) => (
                    <td
                      key={h}
                      className={`px-4 py-3 whitespace-nowrap ${
                        cIdx === 0 ? "text-brand-dark font-semibold" : ""
                      }`}
                    >
                      {formatValue(row[h] || "-", cIdx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to Measure Instructions */}
        <div className="bg-brand-light/30 border-brand-border/60 mt-6 rounded-xl border p-4 sm:p-5">
          <h3 className="text-brand-accent mb-3 text-xs font-bold tracking-wider uppercase">
            How to Take Your Measurements
          </h3>
          <ul className="text-brand-dark/80 space-y-2 text-xs">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="text-brand-gold mt-0.5 h-4 w-4 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer info */}
        <div className="text-brand-dark/60 border-brand-border/60 mt-6 flex flex-col items-center justify-between gap-3 border-t pt-4 text-xs sm:flex-row">
          <p>Have sizing questions or between sizes?</p>
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
