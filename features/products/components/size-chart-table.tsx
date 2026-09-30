"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SizeChartTableProps {
  headers: string[];
  rows: Record<string, string>[];
  tips?: string[];
  defaultUnit?: "inches" | "cm";
  showTips?: boolean;
  className?: string;
}

/**
 * Shared Size Chart Table Component with live Inches/Centimeters unit conversion.
 * Reused across PDP Size Guide modal and the standalone /size-guide page.
 */
export function SizeChartTable({
  headers,
  rows,
  tips = [
    "Bust: Measure under arms around the fullest part of your bust.",
    "Waist: Measure around your natural waistline, keeping the tape comfortably loose.",
    "Hips: Stand with feet together and measure around fullest part of your hips.",
    "Length: Measured from high shoulder point straight down to hemline.",
    "Measurements are garment dimensions. For a relaxed fit, select one size up.",
  ],
  defaultUnit = "inches",
  showTips = true,
  className,
}: SizeChartTableProps) {
  const [unit, setUnit] = React.useState<"inches" | "cm">(defaultUnit);

  // Helper to convert inch string to cm if unit is cm
  const formatValue = (val: string, colIndex: number) => {
    if (colIndex === 0 || unit === "inches" || !val) return val;

    // Check if column header contains (m) - meters don't convert to cm with 2.54
    const header = headers[colIndex] || "";
    if (header.includes("(m)")) return val;

    // Attempt numerical conversion
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
    <div className={cn("space-y-5", className)}>
      {/* Unit Selector Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-brand-muted text-xs font-medium">Measurement Unit:</span>
        <div className="border-brand-border bg-brand-light/30 flex rounded-lg border p-1">
          <button
            type="button"
            onClick={() => setUnit("inches")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              unit === "inches"
                ? "text-brand-dark bg-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark"
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
                : "text-brand-muted hover:text-brand-dark"
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
          <tbody className="divide-brand-border/50 text-brand-muted divide-y">
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
      {showTips && tips && tips.length > 0 && (
        <div className="bg-brand-light/30 border-brand-border/60 rounded-xl border p-4 sm:p-5">
          <h3 className="text-brand-accent mb-3 text-xs font-bold tracking-wider uppercase">
            How to Take Your Measurements
          </h3>
          <ul className="text-brand-muted space-y-2 text-xs">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="text-brand-accent mt-0.5 h-4 w-4 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
