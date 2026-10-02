"use client";

import React from "react";
import { Plus, Trash2, SlidersHorizontal, Sparkles } from "lucide-react";
import type { SpecificationItem } from "../types/products";

interface ProductSpecificationsManagerProps {
  specifications: SpecificationItem[];
  onChange: (specifications: SpecificationItem[]) => void;
}

const COMMON_SPEC_SUGGESTIONS = [
  "Material",
  "Finish",
  "Height",
  "Weight",
  "Dimensions",
  "Origin",
  "Package Contents",
  "Usage",
];

export function ProductSpecificationsManager({
  specifications,
  onChange,
}: ProductSpecificationsManagerProps) {
  const handleAddRow = (label = "", value = "") => {
    onChange([...specifications, { label, value }]);
  };

  const handleUpdateRow = (index: number, field: "label" | "value", text: string) => {
    const updated = specifications.map((row, i) =>
      i === index ? { ...row, [field]: text } : row
    );
    onChange(updated);
  };

  const handleRemoveRow = (index: number) => {
    onChange(specifications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-dark" />
            <h3 className="text-sm font-semibold text-brand-dark">
              Product Specifications
            </h3>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Flexible label-value pairs for technical specs (e.g. Material: Brass, Height: 12 inches).
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleAddRow()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-dark bg-brand-light/40 border border-brand-border rounded-lg hover:bg-brand-light transition-colors self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Specification</span>
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-brand-muted flex items-center gap-1 mr-1">
          <Sparkles className="h-3 w-3 text-brand-accent" />
          Quick Add:
        </span>
        {COMMON_SPEC_SUGGESTIONS.map((preset) => {
          const alreadyExists = specifications.some(
            (s) => s.label.toLowerCase() === preset.toLowerCase()
          );
          return (
            <button
              key={preset}
              type="button"
              disabled={alreadyExists}
              onClick={() => handleAddRow(preset, "")}
              className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                alreadyExists
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-brand-dark border-brand-border/80 hover:border-brand-accent hover:bg-brand-cream/40"
              }`}
            >
              + {preset}
            </button>
          );
        })}
      </div>

      {/* Specifications Rows */}
      {specifications.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-lg p-6 text-center bg-brand-cream/10">
          <p className="text-xs text-brand-muted">
            No specifications added yet. Add custom attributes for lamps, pooja items, or garments.
          </p>
        </div>
      ) : (
        <div className="border border-brand-border rounded-lg overflow-hidden bg-white shadow-xs">
          <div className="grid grid-cols-12 gap-2 bg-brand-light/30 px-3 py-2 text-[11px] font-semibold text-brand-muted uppercase border-b border-brand-border/80">
            <div className="col-span-5 sm:col-span-4">Attribute Name</div>
            <div className="col-span-6 sm:col-span-7">Value</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-brand-border/60">
            {specifications.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-brand-cream/10 transition-colors"
              >
                <div className="col-span-5 sm:col-span-4">
                  <input
                    type="text"
                    placeholder="e.g. Material, Height"
                    value={row.label}
                    onChange={(e) => handleUpdateRow(index, "label", e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-brand-border/80 bg-white focus:outline-none focus:border-brand-accent"
                  />
                </div>
                <div className="col-span-6 sm:col-span-7">
                  <input
                    type="text"
                    placeholder="e.g. Solid Brass, 14 inches"
                    value={row.value}
                    onChange={(e) => handleUpdateRow(index, "value", e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-brand-border/80 bg-white focus:outline-none focus:border-brand-accent"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="text-brand-muted hover:text-red-600 transition-colors p-1"
                    title="Remove specification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
