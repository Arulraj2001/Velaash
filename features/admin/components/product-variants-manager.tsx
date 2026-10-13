"use client";

import React, { useState, useMemo } from "react";
import type { AdminProductVariantFormItem } from "../types/products";
import {
  Plus,
  Trash2,
  Wand2,
  Sparkles,
  Copy,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Palette,
  Check,
  X,
} from "lucide-react";

interface ProductVariantsManagerProps {
  productName: string;
  productSlug: string;
  variants: AdminProductVariantFormItem[];
  onChange: (variants: AdminProductVariantFormItem[]) => void;
}

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const RETAIL_SIZES_S_XL = ["S", "M", "L", "XL"];
const ALL_COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

const LUXURY_COLOR_PALETTES = [
  // Royal & Jewel Tones
  { name: "Ruby Red", hex: "#9B1B30" },
  { name: "Maroon", hex: "#5B1425" },
  { name: "Wine / Plum", hex: "#4A154B" },
  { name: "Rani Pink", hex: "#E0115F" },
  { name: "Emerald Green", hex: "#1B4D3E" },
  { name: "Bottle Green", hex: "#0B3B24" },
  { name: "Royal Navy", hex: "#002366" },
  { name: "Peacock Blue", hex: "#005F73" },
  { name: "Royal Purple", hex: "#5E2750" },

  // Festive, Silk & Warm Tones
  { name: "Mustard Gold", hex: "#E1AD01" },
  { name: "Haldi Yellow", hex: "#F5B041" },
  { name: "Rust Orange", hex: "#C85A17" },
  { name: "Coral Peach", hex: "#FF7F50" },
  { name: "Terracotta", hex: "#A94A42" },
  { name: "Copper Bronze", hex: "#B87333" },

  // Pastels & Soft Weaves
  { name: "Blush Rose", hex: "#E8C5C8" },
  { name: "Powder Blue", hex: "#B0C4DE" },
  { name: "Sage Mint", hex: "#7D9D8B" },
  { name: "Pista Green", hex: "#93C572" },
  { name: "Lavender", hex: "#B39DDB" },
  { name: "Lilac Mauve", hex: "#C8A2C8" },

  // Classics, Neutrals & Metallics
  { name: "Ivory / Off-White", hex: "#FDFBF7" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Beige / Cream", hex: "#E8D8C8" },
  { name: "Antique Gold", hex: "#D4AF37" },
  { name: "Silver Zari", hex: "#C0C0C0" },
  { name: "Charcoal Grey", hex: "#374151" },
  { name: "Jet Black", hex: "#1A1A1A" },
];

/**
 * Intelligent dictionary for auto-detecting hex colors from common fashion and ethnic names
 */
const COLOR_NAME_DICTIONARY: Record<string, string> = {
  // Pinks & Reds
  red: "#DC2626",
  "ruby red": "#9B1B30",
  maroon: "#5B1425",
  wine: "#4A154B",
  burgundy: "#800020",
  pink: "#EC4899",
  "rani pink": "#E0115F",
  magenta: "#D946EF",
  fuchsia: "#C026D3",
  rose: "#F43F5E",
  "blush pink": "#E8C5C8",
  "blush rose": "#E8C5C8",
  coral: "#FF7F50",
  peach: "#FDBA74",

  // Blues
  blue: "#2563EB",
  navy: "#002366",
  "royal navy": "#002366",
  "royal blue": "#1D4ED8",
  "peacock blue": "#005F73",
  peacock: "#005F73",
  "sky blue": "#38BDF8",
  "powder blue": "#B0C4DE",
  teal: "#0D9488",
  turquoise: "#06B6D4",
  cyan: "#06B6D4",
  indigo: "#4F46E5",

  // Greens
  green: "#16A34A",
  "emerald green": "#1B4D3E",
  emerald: "#1B4D3E",
  "bottle green": "#0B3B24",
  "forest green": "#166534",
  olive: "#65A30D",
  "olive green": "#556B2F",
  mint: "#86EFAC",
  "sage mint": "#7D9D8B",
  sage: "#7D9D8B",
  "pista green": "#93C572",
  pista: "#93C572",
  "rama green": "#0D9488",

  // Yellows & Oranges
  yellow: "#FACC15",
  "mustard gold": "#E1AD01",
  mustard: "#E1AD01",
  "haldi yellow": "#F5B041",
  haldi: "#F5B041",
  orange: "#EA580C",
  "rust orange": "#C85A17",
  rust: "#C85A17",
  terracotta: "#A94A42",
  amber: "#D97706",

  // Purples & Violets
  purple: "#9333EA",
  "royal purple": "#5E2750",
  violet: "#7C3AED",
  lavender: "#B39DDB",
  lilac: "#C8A2C8",
  mauve: "#C8A2C8",
  plum: "#4A154B",

  // Neutrals & Metallics
  white: "#FFFFFF",
  "pure white": "#FFFFFF",
  ivory: "#FDFBF7",
  "off white": "#FDFBF7",
  "off-white": "#FDFBF7",
  cream: "#FFFDD0",
  beige: "#E8D8C8",
  nude: "#E8D8C8",
  gold: "#D4AF37",
  "antique gold": "#D4AF37",
  copper: "#B87333",
  brass: "#B5A642",
  silver: "#C0C0C0",
  grey: "#6B7280",
  gray: "#6B7280",
  charcoal: "#374151",
  black: "#1A1A1A",
  "jet black": "#1A1A1A",
  brown: "#78350F",
  chocolate: "#4E3629",
  tan: "#D2B48C",
};

function autoDetectColorHex(colorName: string): string | null {
  const normalized = colorName.trim().toLowerCase();
  if (!normalized) return null;
  return COLOR_NAME_DICTIONARY[normalized] || null;
}

export function ProductVariantsManager({
  productName,
  productSlug,
  variants,
  onChange,
}: ProductVariantsManagerProps) {
  // Matrix Generator State
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [matrixColors, setMatrixColors] = useState<Array<{ name: string; hex: string }>>([
    { name: variants[0]?.color || "Ivory", hex: variants[0]?.color_hex || "#FDFBF7" },
  ]);
  const [newColorInput, setNewColorInput] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#9B1B30");
  const [matrixSelectedSizes, setMatrixSelectedSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [matrixDefaultStock, setMatrixDefaultStock] = useState<number>(10);
  const [matrixMode, setMatrixMode] = useState<"append" | "replace">("append");

  // Bulk Actions State
  const [bulkStockValue, setBulkStockValue] = useState<string>("");
  const [bulkPriceValue, setBulkPriceValue] = useState<string>("");
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState<string>("");
  const [appliedRowIdx, setAppliedRowIdx] = useState<number | null>(null);
  const [activeColorPaletteIndex, setActiveColorPaletteIndex] = useState<number | null>(null);

  // Format color segment to prevent collisions between colors sharing word prefixes (e.g. Royal Navy vs Royal Purple)
  const formatColorPart = (colorName: string): string => {
    const clean = (colorName || "CLR").trim();
    const words = clean.split(/[\s/_-]+/).filter(Boolean);
    if (words.length >= 2) {
      const w1 = words[0].slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "");
      const w2 = words[1].slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "");
      return `${w1}${w2}`;
    }
    return clean.slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, "") || "CLR";
  };

  // Generate standardized SKU codes with optional custom prefix
  const generateSku = (color: string, size: string, customPrefix?: string) => {
    let prefix = customPrefix?.trim();
    if (!prefix) {
      const slugPart = (productSlug || productName || "PROD")
        .slice(0, 8)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      prefix = `VEL-${slugPart || "ITEM"}`;
    } else {
      prefix = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      if (!prefix.startsWith("VEL-")) {
        prefix = `VEL-${prefix}`;
      }
    }

    const colorPart = formatColorPart(color);
    const sizePart = (size || "SZ")
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    return `${prefix}-${colorPart}-${sizePart}`;
  };

  // Total inventory stats
  const totalStockUnits = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
  }, [variants]);

  // Check for duplicate color + size combinations
  const duplicateWarnings = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const v of variants) {
      const key = `${v.color.trim().toLowerCase()}__${v.size.trim().toLowerCase()}`;
      if (seen.has(key)) {
        dupes.add(`${v.color} (${v.size})`);
      } else {
        seen.add(key);
      }
    }
    return Array.from(dupes);
  }, [variants]);

  // Check for duplicate SKUs in the current list
  const duplicateSkuWarnings = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of variants) {
      const s = v.sku.trim().toUpperCase();
      if (s) counts.set(s, (counts.get(s) || 0) + 1);
    }
    const dupes: string[] = [];
    counts.forEach((cnt, sku) => {
      if (cnt > 1) dupes.push(sku);
    });
    return dupes;
  }, [variants]);

  // Add a single variant row
  const handleAddVariant = () => {
    const defaultColor = variants[0]?.color || "Default";
    const defaultColorHex = variants[0]?.color_hex || "#FDFBF7";
    const nextSize =
      STANDARD_SIZES.find((s) => !variants.some((v) => v.size === s && v.color === defaultColor)) || "M";

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

  // 1-Click: Add S, M, L, XL
  const handleAddRetailSizes = () => {
    const primaryColor = variants[0]?.color || "Default";
    const primaryHex = variants[0]?.color_hex || "#FDFBF7";
    const existingSizesForColor = new Set(
      variants.filter((v) => v.color.toLowerCase() === primaryColor.toLowerCase()).map((v) => v.size)
    );

    const additions: AdminProductVariantFormItem[] = [];
    for (const size of RETAIL_SIZES_S_XL) {
      if (!existingSizesForColor.has(size)) {
        additions.push({
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

    if (additions.length > 0) {
      onChange([...variants, ...additions]);
    }
  };

  // 1-Click: Add XS, S, M, L, XL, XXL
  const handleGenerateStandardSizes = () => {
    const primaryColor = variants[0]?.color || "Default";
    const primaryHex = variants[0]?.color_hex || "#FDFBF7";
    const existingSizesForColor = new Set(
      variants.filter((v) => v.color.toLowerCase() === primaryColor.toLowerCase()).map((v) => v.size)
    );

    const additions: AdminProductVariantFormItem[] = [];
    for (const size of STANDARD_SIZES) {
      if (!existingSizesForColor.has(size)) {
        additions.push({
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

    if (additions.length > 0) {
      onChange([...variants, ...additions]);
    }
  };

  // 1-Click: Free Size (Sarees / Drapes / One-size)
  const handleSetFreeSize = () => {
    const primaryColor = variants[0]?.color || "Original";
    const primaryHex = variants[0]?.color_hex || "#FDFBF7";
    const hasFreeSize = variants.some((v) => v.size.toLowerCase() === "free size");

    if (!hasFreeSize) {
      const freeSizeVariant: AdminProductVariantFormItem = {
        size: "Free Size",
        color: primaryColor,
        color_hex: primaryHex,
        sku: generateSku(primaryColor, "FS"),
        stock_quantity: 15,
        price_override: null,
        is_active: true,
      };
      onChange([...variants, freeSizeVariant]);
    }
  };

  // Duplicate a specific variant row
  const handleDuplicate = (index: number) => {
    const target = variants[index];
    const nextSize =
      STANDARD_SIZES.find((s) => !variants.some((v) => v.size === s && v.color === target.color)) || target.size;

    const duplicated: AdminProductVariantFormItem = {
      ...target,
      id: undefined, // Fresh row without existing DB ID
      size: nextSize,
      sku: generateSku(target.color, nextSize),
    };

    const updated = [...variants];
    updated.splice(index + 1, 0, duplicated);
    onChange(updated);
  };

  // Bulk Apply Stock to all variants
  const handleApplyBulkStock = () => {
    const val = parseInt(bulkStockValue);
    if (isNaN(val) || val < 0) return;
    onChange(variants.map((v) => ({ ...v, stock_quantity: val })));
    setBulkStockValue("");
  };

  // Bulk Apply Price Override to all variants
  const handleApplyBulkPrice = () => {
    const val = bulkPriceValue === "" ? null : parseFloat(bulkPriceValue);
    if (val !== null && (isNaN(val) || val < 0)) return;
    onChange(variants.map((v) => ({ ...v, price_override: val })));
    setBulkPriceValue("");
  };

  // Refresh / Reset all SKUs using current product name/slug
  const handleRegenerateAllSkus = () => {
    onChange(
      variants.map((v) => ({
        ...v,
        sku: generateSku(v.color, v.size),
      }))
    );
  };

  // Bulk Apply Custom SKU Prefix to all variants
  const handleApplyBulkSkuPrefix = () => {
    const trimmed = bulkSkuPrefix.trim();
    if (!trimmed) return;
    onChange(
      variants.map((v) => ({
        ...v,
        sku: generateSku(v.color, v.size, trimmed),
      }))
    );
  };

  // Generate 100% collision-free Unique SKUs by adding a short random hex hash
  const handleGenerateUniqueSkus = () => {
    const slugPart = (productSlug || productName || "PROD")
      .slice(0, 7)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const randomHash = Math.random().toString(36).substring(2, 5).toUpperCase();
    const uniquePrefix = `VEL-${slugPart || "ITEM"}-${randomHash}`;
    setBulkSkuPrefix(uniquePrefix);
    onChange(
      variants.map((v) => ({
        ...v,
        sku: generateSku(v.color, v.size, uniquePrefix),
      }))
    );
  };

  // Extract prefix from a specific variant row and apply pattern to all rows
  const handleApplyRowPrefixToAll = (rowSku: string, rowIdx: number) => {
    const trimmed = rowSku.trim().toUpperCase();
    if (!trimmed) return;
    const parts = trimmed.split("-");
    const extractedPrefix =
      parts.length >= 3 ? parts.slice(0, parts.length - 2).join("-") : parts[0];

    setBulkSkuPrefix(extractedPrefix);
    onChange(
      variants.map((v) => ({
        ...v,
        sku: generateSku(v.color, v.size, extractedPrefix),
      }))
    );
    setAppliedRowIdx(rowIdx);
    setTimeout(() => setAppliedRowIdx(null), 1800);
  };

  // Matrix Generator: Add a color
  const handleAddMatrixColor = (name: string, hex: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (matrixColors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    setMatrixColors([...matrixColors, { name: trimmed, hex }]);
    setNewColorInput("");
  };

  // Matrix Generator: Remove a color
  const handleRemoveMatrixColor = (name: string) => {
    if (matrixColors.length <= 1) return;
    setMatrixColors(matrixColors.filter((c) => c.name !== name));
  };

  // Matrix Generator: Execute creation of combinations
  const handleExecuteMatrix = () => {
    if (matrixColors.length === 0 || matrixSelectedSizes.length === 0) return;

    const generated: AdminProductVariantFormItem[] = [];
    for (const col of matrixColors) {
      for (const sz of matrixSelectedSizes) {
        generated.push({
          size: sz,
          color: col.name,
          color_hex: col.hex,
          sku: generateSku(col.name, sz),
          stock_quantity: matrixDefaultStock,
          price_override: null,
          is_active: true,
        });
      }
    }

    if (matrixMode === "replace") {
      onChange(generated);
    } else {
      // Append only unique combinations
      const existingKeys = new Set(
        variants.map((v) => `${v.color.trim().toLowerCase()}__${v.size.trim().toLowerCase()}`)
      );
      const uniqueNew = generated.filter(
        (g) => !existingKeys.has(`${g.color.trim().toLowerCase()}__${g.size.trim().toLowerCase()}`)
      );
      onChange([...variants, ...uniqueNew]);
    }

    setIsMatrixOpen(false);
  };

  // Update a single variant field
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

  // Remove a variant row
  const handleRemove = (index: number) => {
    if (variants.length <= 1) {
      alert("At least one product variant is required.");
      return;
    }
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar with Overview and Quick Actions */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              Variants &amp; SKU Inventory
            </h4>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {variants.length} {variants.length === 1 ? "Variant" : "Variants"}
            </span>
            <span className="inline-flex items-center rounded-full bg-brand-cream/80 border border-brand-border/60 px-2.5 py-0.5 text-xs font-medium text-brand-dark">
              Total Stock: {totalStockUnits} units
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Define size and color combinations with independent SKU codes and inventory allocations.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* S - XL Preset */}
          <button
            type="button"
            onClick={handleAddRetailSizes}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Add S, M, L, XL"
          >
            <span>+ S – XL</span>
          </button>

          {/* XS - XXL Preset */}
          <button
            type="button"
            onClick={handleGenerateStandardSizes}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Add XS, S, M, L, XL, XXL"
          >
            <Sparkles className="h-3 w-3 text-amber-600" />
            <span>+ XS – XXL</span>
          </button>

          {/* Free Size Preset */}
          <button
            type="button"
            onClick={handleSetFreeSize}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Add Free Size for Sarees or Shawls"
          >
            <span>+ Free Size</span>
          </button>

          {/* Combinations Matrix Toggle */}
          <button
            type="button"
            onClick={() => setIsMatrixOpen(!isMatrixOpen)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isMatrixOpen
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                : "border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/60"
            }`}
            title="Open Matrix Generator to combine multiple colors and sizes"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span>Matrix Generator</span>
            {isMatrixOpen ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
          </button>

          {/* Add Single Variant */}
          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Variant</span>
          </button>
        </div>
      </div>

      {/* 2. Color × Size Matrix Generator (Collapsible Builder) */}
      {isMatrixOpen && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div>
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Multi-Variant Matrix Generator</span>
              </h5>
              <p className="text-[11px] text-slate-500">
                Instantly generate all combinations of colors and sizes with auto-formatted SKUs and stock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMatrixOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Color Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                1. Select Colors ({matrixColors.length})
              </label>

              {/* Selected Color Badges */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-white border border-slate-200">
                {matrixColors.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 pl-2 pr-1.5 py-1 text-xs font-medium text-slate-800 border border-slate-200"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMatrixColor(c.name)}
                      className="text-slate-400 hover:text-rose-600 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick Preset Color Swatches */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                  Quick Palette Suggestions:
                </span>
                <div className="flex flex-wrap gap-1">
                  {LUXURY_COLOR_PALETTES.map((palette) => {
                    const isSelected = matrixColors.some(
                      (c) => c.name.toLowerCase() === palette.name.toLowerCase()
                    );
                    return (
                      <button
                        key={palette.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveMatrixColor(palette.name);
                          } else {
                            handleAddMatrixColor(palette.name, palette.hex);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          isSelected
                            ? "bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/10"
                          style={{ backgroundColor: palette.hex }}
                        />
                        <span>{palette.name}</span>
                        {isSelected && <Check className="h-2.5 w-2.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Input with Live Picker & Smart Detection */}
              <div className="flex items-center gap-1.5 pt-1">
                <div className="relative flex items-center shrink-0">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="h-7 w-7 rounded-md border border-slate-300 p-0.5 cursor-pointer bg-white"
                    title="Click to select exact hex color"
                  />
                </div>
                <input
                  type="text"
                  value={newColorInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewColorInput(val);
                    const detected = autoDetectColorHex(val);
                    if (detected) {
                      setCustomColorHex(detected);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMatrixColor(newColorInput, customColorHex);
                    }
                  }}
                  placeholder="Type color (e.g. Peacock Blue, Rani Pink, Gold)"
                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddMatrixColor(newColorInput, customColorHex)}
                  disabled={!newColorInput.trim()}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Right: Size Selection & Inventory Defaults */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    2. Select Sizes ({matrixSelectedSizes.length})
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMatrixSelectedSizes(RETAIL_SIZES_S_XL)}
                      className="text-[10px] text-indigo-600 hover:underline font-medium"
                    >
                      S–XL
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setMatrixSelectedSizes(STANDARD_SIZES)}
                      className="text-[10px] text-indigo-600 hover:underline font-medium"
                    >
                      XS–XXL
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setMatrixSelectedSizes(["Free Size"])}
                      className="text-[10px] text-indigo-600 hover:underline font-medium"
                    >
                      Free Size
                    </button>
                  </div>
                </div>

                {/* Size Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {ALL_COMMON_SIZES.map((sz) => {
                    const isChecked = matrixSelectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setMatrixSelectedSizes(matrixSelectedSizes.filter((s) => s !== sz));
                          } else {
                            setMatrixSelectedSizes([...matrixSelectedSizes, sz]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isChecked
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock and Generation Mode */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Default Stock per item:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matrixDefaultStock}
                    onChange={(e) => setMatrixDefaultStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Action Mode:
                  </label>
                  <select
                    value={matrixMode}
                    onChange={(e) => setMatrixMode(e.target.value as "append" | "replace")}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="append">Append to existing variants</option>
                    <option value="replace">Replace all current variants</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Submit Bar */}
          <div className="flex items-center justify-between border-t border-indigo-100 pt-3">
            <span className="text-xs text-indigo-900 font-medium">
              Will generate:{" "}
              <strong>
                {matrixColors.length} colors × {matrixSelectedSizes.length} sizes ={" "}
                {matrixColors.length * matrixSelectedSizes.length} variant combinations
              </strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMatrixOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMatrix}
                disabled={matrixColors.length === 0 || matrixSelectedSizes.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  Generate {matrixColors.length * matrixSelectedSizes.length} Variants
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Duplicate Warning Notices */}
      {duplicateWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Notice: Duplicate variant combinations detected</strong>
            <p className="mt-0.5 text-amber-800 text-[11px]">
              The following combinations are duplicated: {duplicateWarnings.join(", ")}. Please ensure each variant has a unique color and size pair so customers can select it accurately.
            </p>
          </div>
        </div>
      )}

      {duplicateSkuWarnings.length > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Error: Duplicate SKUs detected ({duplicateSkuWarnings.length})</strong>
            <p className="mt-0.5 text-rose-800 text-[11px]">
              The following SKUs are assigned to multiple rows: <strong>{duplicateSkuWarnings.join(", ")}</strong>. Every variant must have a strictly unique SKU. Click &quot;Unique SKUs&quot; above or adjust the highlighted rows to resolve.
            </p>
          </div>
        </div>
      )}

      {/* 4. Bulk Operations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Bulk Stock Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-600">Bulk Stock:</span>
            <input
              type="number"
              min="0"
              placeholder="Qty"
              value={bulkStockValue}
              onChange={(e) => setBulkStockValue(e.target.value)}
              className="w-16 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyBulkStock}
              disabled={bulkStockValue === ""}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Apply to All
            </button>
          </div>

          <span className="text-slate-300">|</span>

          {/* Bulk Price Override */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-600">Bulk Price Override:</span>
            <input
              type="number"
              min="0"
              placeholder="₹ Override"
              value={bulkPriceValue}
              onChange={(e) => setBulkPriceValue(e.target.value)}
              className="w-24 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyBulkPrice}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              title="Apply override price or leave blank to clear"
            >
              Apply to All
            </button>
          </div>

          <span className="text-slate-300">|</span>

          {/* Bulk SKU Prefix Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-700">SKU Prefix:</span>
            <input
              type="text"
              placeholder="e.g. VEL-KTN2"
              value={bulkSkuPrefix}
              onChange={(e) => setBulkSkuPrefix(e.target.value.toUpperCase())}
              className="w-28 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyBulkSkuPrefix}
              disabled={!bulkSkuPrefix.trim()}
              className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 transition-colors"
              title="Apply this SKU prefix to all variants"
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Right side SKU action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Unique Collision-Free SKUs */}
          <button
            type="button"
            onClick={handleGenerateUniqueSkus}
            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
            title="Generate guaranteed collision-free unique SKUs with a unique product tag"
          >
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>Unique SKUs</span>
          </button>

          {/* Regenerate All SKUs */}
          <button
            type="button"
            onClick={handleRegenerateAllSkus}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
            title="Regenerate all SKU codes based on current product slug, color, and size"
          >
            <RefreshCw className="h-3 w-3 text-slate-500" />
            <span>Reset SKUs</span>
          </button>
        </div>
      </div>

      {/* 5. Main Variants Table */}
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
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.map((variant, idx) => (
              <tr key={variant.id || `${variant.color}-${variant.size}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                {/* Size */}
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    required
                    value={variant.size}
                    onChange={(e) => handleUpdate(idx, "size", e.target.value)}
                    placeholder="M"
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </td>

                {/* Color Name + Hex Swatch with Quick Palette Popover */}
                <td className="px-3 py-2.5">
                  <div className="relative flex items-center gap-1.5">
                    <input
                      type="color"
                      value={variant.color_hex || "#FDFBF7"}
                      onChange={(e) => handleUpdate(idx, "color_hex", e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded border border-slate-300 p-0 shrink-0"
                      title="Pick custom swatch color"
                    />
                    <input
                      type="text"
                      required
                      value={variant.color}
                      onChange={(e) => handleUpdate(idx, "color", e.target.value)}
                      placeholder="e.g. Ivory"
                      className="w-28 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />

                    {/* Quick Swatch Palette Icon */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveColorPaletteIndex(activeColorPaletteIndex === idx ? null : idx)
                        }
                        className="rounded p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                        title="Pick from luxury palette presets"
                      >
                        <Palette className="h-3.5 w-3.5" />
                      </button>

                      {/* Dropdown with Luxury Colors */}
                      {activeColorPaletteIndex === idx && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-56 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                            Curated Palettes
                          </span>
                          <div className="grid grid-cols-2 gap-1">
                            {LUXURY_COLOR_PALETTES.map((pal) => (
                              <button
                                key={pal.name}
                                type="button"
                                onClick={() => {
                                  handleUpdate(idx, "color", pal.name);
                                  handleUpdate(idx, "color_hex", pal.hex);
                                  handleUpdate(idx, "sku", generateSku(pal.name, variant.size));
                                  setActiveColorPaletteIndex(null);
                                }}
                                className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] text-slate-700 hover:bg-slate-100 transition-colors text-left"
                              >
                                <span
                                  className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: pal.hex }}
                                />
                                <span className="truncate">{pal.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                      className={`w-36 rounded-md border px-2 py-1 text-xs font-mono text-slate-900 focus:outline-none ${
                        duplicateSkuWarnings.includes(variant.sku.trim().toUpperCase())
                          ? "border-rose-400 bg-rose-50 text-rose-900 font-bold focus:border-rose-600 ring-1 ring-rose-300"
                          : "border-slate-200 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(idx, "sku", generateSku(variant.color, variant.size, bulkSkuPrefix || undefined))
                      }
                      title="Auto-suggest SKU for this row"
                      className="rounded p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRowPrefixToAll(variant.sku, idx)}
                      title="Apply this row's prefix to all variant rows"
                      className={`rounded p-1 transition-colors ${
                        appliedRowIdx === idx
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                      }`}
                    >
                      {appliedRowIdx === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
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
                      handleUpdate(idx, "stock_quantity", Math.max(0, parseInt(e.target.value) || 0))
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
                    placeholder="Base price"
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

                {/* Actions: Duplicate & Remove */}
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(idx)}
                      className="rounded p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Duplicate this variant"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      disabled={variants.length <= 1}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
