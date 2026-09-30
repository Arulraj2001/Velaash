"use client";

import React, { useState } from "react";
import { Plus, Trash2, RotateCcw, Ruler } from "lucide-react";
import type { AdminCategorySizeChartData } from "../types/categories";

const DEFAULT_STANDARD_HEADERS = [
  "Size",
  "Bust (in)",
  "Waist (in)",
  "Hip (in)",
  "Length (in)",
];

const DEFAULT_STANDARD_ROWS = [
  { Size: "XS", "Bust (in)": "32", "Waist (in)": "26", "Hip (in)": "35", "Length (in)": "44" },
  { Size: "S", "Bust (in)": "34", "Waist (in)": "28", "Hip (in)": "37", "Length (in)": "44" },
  { Size: "M", "Bust (in)": "36", "Waist (in)": "30", "Hip (in)": "39", "Length (in)": "45" },
  { Size: "L", "Bust (in)": "38", "Waist (in)": "32", "Hip (in)": "41", "Length (in)": "45" },
  { Size: "XL", "Bust (in)": "40", "Waist (in)": "34", "Hip (in)": "43", "Length (in)": "46" },
  { Size: "XXL", "Bust (in)": "42", "Waist (in)": "36", "Hip (in)": "45", "Length (in)": "46" },
  { Size: "Free Size", "Bust (in)": "34-40", "Waist (in)": "28-36", "Hip (in)": "38-44", "Length (in)": "46" },
];

interface CategorySizeChartEditorProps {
  value: AdminCategorySizeChartData | null;
  onChange: (value: AdminCategorySizeChartData | null) => void;
  categoryName?: string;
}

export function CategorySizeChartEditor({
  value,
  onChange,
  categoryName,
}: CategorySizeChartEditorProps) {
  const isEnabled = Boolean(value);

  const [newColHeader, setNewColHeader] = useState("");
  const [showAddColInput, setShowAddColInput] = useState(false);

  const handleEnableToggle = (enabled: boolean) => {
    if (enabled) {
      onChange({
        name: categoryName ? `${categoryName} Standard Size Guide` : "Standard Garment Fit Guide",
        measurement_unit: "inches",
        headers: [...DEFAULT_STANDARD_HEADERS],
        rows: [...DEFAULT_STANDARD_ROWS],
        tips: [
          "Bust: Measure under arms around the fullest part of your bust.",
          "Waist: Measure around your natural waistline, keeping the tape comfortably loose.",
          "Hips: Stand with feet together and measure around the fullest part of your hips.",
          "Length: Measured from high shoulder point straight down to hemline.",
        ],
      });
    } else {
      onChange(null);
    }
  };

  const updateField = <K extends keyof AdminCategorySizeChartData>(
    field: K,
    val: AdminCategorySizeChartData[K]
  ) => {
    if (!value) return;
    onChange({
      ...value,
      [field]: val,
    });
  };

  const handleCellChange = (rowIndex: number, colHeader: string, text: string) => {
    if (!value) return;
    const newRows = [...value.rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [colHeader]: text,
    };
    updateField("rows", newRows);
  };

  const handleHeaderChange = (oldHeader: string, newHeader: string) => {
    if (!value || !newHeader.trim()) return;
    const cleanNew = newHeader.trim();
    if (cleanNew === oldHeader) return;

    const newHeaders = value.headers.map((h) => (h === oldHeader ? cleanNew : h));
    const newRows = value.rows.map((row) => {
      const updated = { ...row };
      updated[cleanNew] = updated[oldHeader] || "";
      delete updated[oldHeader];
      return updated;
    });

    onChange({
      ...value,
      headers: newHeaders,
      rows: newRows,
    });
  };

  const handleAddColumn = () => {
    if (!value || !newColHeader.trim()) return;
    const header = newColHeader.trim();
    if (value.headers.includes(header)) {
      return;
    }
    const newHeaders = [...value.headers, header];
    const newRows = value.rows.map((r) => ({ ...r, [header]: "" }));
    onChange({
      ...value,
      headers: newHeaders,
      rows: newRows,
    });
    setNewColHeader("");
    setShowAddColInput(false);
  };

  const handleDeleteColumn = (header: string) => {
    if (!value || value.headers.length <= 1) return;
    const newHeaders = value.headers.filter((h) => h !== header);
    const newRows = value.rows.map((r) => {
      const updated = { ...r };
      delete updated[header];
      return updated;
    });
    onChange({
      ...value,
      headers: newHeaders,
      rows: newRows,
    });
  };

  const handleAddRow = () => {
    if (!value) return;
    const newRow: Record<string, string> = {};
    for (const h of value.headers) {
      newRow[h] = h.toLowerCase().includes("size") ? "Custom" : "";
    }
    updateField("rows", [...value.rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (!value || value.rows.length <= 1) return;
    const newRows = value.rows.filter((_, i) => i !== index);
    updateField("rows", newRows);
  };

  const handleResetToStandard = () => {
    if (!value) return;
    onChange({
      ...value,
      headers: [...DEFAULT_STANDARD_HEADERS],
      rows: [...DEFAULT_STANDARD_ROWS],
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Ruler className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Category Default Size Chart
            </h4>
            <p className="text-[11px] text-slate-500">
              Inherited by products in this category without individual size overrides.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleEnableToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="ml-2 text-xs font-medium text-slate-700">
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {isEnabled && value && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Size Chart Title
              </label>
              <input
                type="text"
                value={value.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Kurtas &amp; Sets Size Chart"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Measurement Unit
              </label>
              <select
                value={value.measurement_unit}
                onChange={(e) =>
                  updateField(
                    "measurement_unit",
                    e.target.value as "inches" | "cm"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="inches">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
              </select>
            </div>
          </div>

          {/* Table Matrix Editor */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="w-8 px-2 py-2 text-center text-[10px] text-slate-400">#</th>
                  {value.headers.map((h) => (
                    <th key={h} className="px-2 py-1.5 min-w-[100px]">
                      <div className="flex items-center justify-between gap-1 group">
                        <input
                          type="text"
                          defaultValue={h}
                          onBlur={(e) => handleHeaderChange(h, e.target.value)}
                          className="w-full bg-transparent font-semibold text-[11px] text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none rounded px-1"
                        />
                        {value.headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(h)}
                            title="Delete column"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-10 px-2 py-1 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {value.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-2 py-1.5 text-center text-[10px] text-slate-400 font-mono">
                      {rIdx + 1}
                    </td>
                    {value.headers.map((h) => (
                      <td key={h} className="px-2 py-1">
                        <input
                          type="text"
                          value={row[h] ?? ""}
                          onChange={(e) => handleCellChange(rIdx, h, e.target.value)}
                          placeholder="-"
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center">
                      {value.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rIdx)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add Size Row</span>
              </button>

              {showAddColInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newColHeader}
                    onChange={(e) => setNewColHeader(e.target.value)}
                    placeholder="e.g. Sleeve (in)"
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-900 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddColumn();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddColInput(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddColInput(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Measurement Column</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
              title="Reset matrix to standard Indian apparel sizing"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Standard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
