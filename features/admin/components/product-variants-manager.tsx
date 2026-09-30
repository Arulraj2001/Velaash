"use client";

import React from "react";
import type { AdminProductVariantFormItem } from "../types/products";
import { Plus, Trash2, Wand2, Sparkles } from "lucide-react";

interface ProductVariantsManagerProps {
  productName: string;
  productSlug: string;
  variants: AdminProductVariantFormItem[];
  onChange: (variants: AdminProductVariantFormItem[]) => void;
}

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProductVariantsManager({
  productName,
  productSlug,
  variants,
  onChange,
}: ProductVariantsManagerProps) {
  const generateSku = (color: string, size: string) => {
    const slugPart = (productSlug || productName || "PROD")
      .slice(0, 8)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const colorPart = (color || "CLR")
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const sizePart = (size || "SZ")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    return `VEL-${slugPart}-${colorPart}-${sizePart}`;
  };

  const handleAddVariant = () => {
    const defaultColor = variants[0]?.color || "Default";
    const defaultColorHex = variants[0]?.color_hex || "#CC6F00";
    const nextSize =
      STANDARD_SIZES.find((s) => !variants.some((v) => v.size === s)) || "M";

    const newVariant: AdminProductVariantFormItem = {
      size: nextSize,
      color: defaultColor,
      color_hex: defaultColorHex,
      sku: generateSku(defaultColor, nextSize),
      stock_quantity: 10,
      price_override: null,
      is_active: true,
    };

    onChange([...variants, newVariant]);
  };

  const handleGenerateStandardSizes = () => {
    const primaryColor = variants[0]?.color || "Standard";
    const primaryHex = variants[0]?.color_hex || "#4D2A00";

    const existingSizes = new Set(variants.map((v) => v.size));
    const newAdditions: AdminProductVariantFormItem[] = [];

    for (const size of STANDARD_SIZES) {
      if (!existingSizes.has(size)) {
        newAdditions.push({
          size,
          color: primaryColor,
          color_hex: primaryHex,
          sku: generateSku(primaryColor, size),
          stock_quantity: 10,
          price_override: null,
          is_active: true,
        });
      }
    }

    if (newAdditions.length > 0) {
      onChange([...variants, ...newAdditions]);
    }
  };

  const handleUpdate = (
    index: number,
    field: keyof AdminProductVariantFormItem,
    value: unknown
  ) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (variants.length <= 1) {
      alert("At least one product variant is required.");
      return;
    }
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-900">
            Variants &amp; SKU Inventory ({variants.length})
          </h4>
          <p className="text-[11px] text-slate-500">
            Define size and color combinations with independent SKU codes and stock allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateStandardSizes}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Add XS, S, M, L, XL, XXL in one click"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Add XS-XXL</span>
          </button>

          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Variant</span>
          </button>
        </div>
      </div>

      {/* Variants Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] uppercase font-semibold text-slate-600 tracking-wider">
              <th className="px-3 py-2.5">Size</th>
              <th className="px-3 py-2.5">Color &amp; Swatch</th>
              <th className="px-3 py-2.5">SKU Code</th>
              <th className="px-3 py-2.5">Stock Qty</th>
              <th className="px-3 py-2.5">Price Override (₹)</th>
              <th className="px-3 py-2.5 text-center">Active</th>
              <th className="px-3 py-2.5 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.map((variant, idx) => (
              <tr key={variant.id || idx} className="hover:bg-slate-50/50 transition-colors">
                {/* Size */}
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    required
                    value={variant.size}
                    onChange={(e) => handleUpdate(idx, "size", e.target.value)}
                    placeholder="M"
                    className="w-16 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </td>

                {/* Color Name + Hex Swatch */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={variant.color_hex || "#4D2A00"}
                      onChange={(e) => handleUpdate(idx, "color_hex", e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded border border-slate-300 p-0"
                      title="Pick swatch color"
                    />
                    <input
                      type="text"
                      required
                      value={variant.color}
                      onChange={(e) => handleUpdate(idx, "color", e.target.value)}
                      placeholder="e.g. Ivory"
                      className="w-28 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* SKU Code */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      required
                      value={variant.sku}
                      onChange={(e) => handleUpdate(idx, "sku", e.target.value.toUpperCase())}
                      placeholder="VEL-ITEM-S"
                      className="w-36 rounded-md border border-slate-200 px-2 py-1 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(idx, "sku", generateSku(variant.color, variant.size))
                      }
                      title="Auto-suggest SKU"
                      className="rounded p-1 text-slate-400 hover:text-indigo-600"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>

                {/* Stock Quantity */}
                <td className="px-3 py-2.5">
                  <input
                    type="number"
                    min="0"
                    required
                    value={variant.stock_quantity}
                    onChange={(e) =>
                      handleUpdate(idx, "stock_quantity", parseInt(e.target.value) || 0)
                    }
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </td>

                {/* Price Override */}
                <td className="px-3 py-2.5">
                  <input
                    type="number"
                    min="0"
                    value={variant.price_override ?? ""}
                    onChange={(e) =>
                      handleUpdate(
                        idx,
                        "price_override",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="Same as base"
                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </td>

                {/* Active Toggle */}
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(e) => handleUpdate(idx, "is_active", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>

                {/* Remove */}
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    disabled={variants.length <= 1}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    title="Remove variant"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
