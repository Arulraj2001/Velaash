"use client";

import React, { useState, useTransition } from "react";
import { CsvProductRowSchema, type CsvProductRow } from "../types/products";
import { importProductsCsvAction } from "../actions/product-actions";
import {
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";


interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RowValidationResult {
  rowNumber: number;
  data: CsvProductRow | null;
  error?: string;
}

export function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CsvImportModalProps) {
  const [isPending, startTransition] = useTransition();
  const [validationResults, setValidationResults] = useState<RowValidationResult[] | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers =
      "name,slug,category_slug,base_price,compare_at_price,fabric,care_instructions,size,color,sku,stock_quantity,is_active,is_featured\n";
    const sampleRows =
      'Pintuck Silk Kurta,pintuck-silk-kurta,straight-kurtas,4999,6499,Pure Chanderi Silk,Dry Clean Only,M,Dusty Peach,VEL-PINT-PCH-M,15,true,true\n' +
      'Pintuck Silk Kurta,pintuck-silk-kurta,straight-kurtas,4999,6499,Pure Chanderi Silk,Dry Clean Only,L,Dusty Peach,VEL-PINT-PCH-L,8,true,true\n';

    const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "velaash-products-import-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSummary(null);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length <= 1) {
      alert("CSV file is empty or only contains headers.");
      return;
    }

    const headerKeys = lines[0].split(",").map((k) => k.trim());
    const results: RowValidationResult[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(",").map((v) => v.trim());

      const rawRow: Record<string, unknown> = {};
      headerKeys.forEach((key, idx) => {
        rawRow[key] = values[idx] ?? "";
      });

      const parsed = CsvProductRowSchema.safeParse(rawRow);
      if (parsed.success) {
        results.push({
          rowNumber: i + 1,
          data: parsed.data,
        });
      } else {
        results.push({
          rowNumber: i + 1,
          data: null,
          error: parsed.error.issues.map((issue) => issue.message).join("; "),
        });
      }
    }

    setValidationResults(results);
  };

  const validRows = (validationResults ?? [])
    .filter((r) => r.data !== null)
    .map((r) => r.data as CsvProductRow);

  const invalidRows = (validationResults ?? []).filter((r) => r.data === null);

  const handleCommit = (onlyValid: boolean) => {
    if (validRows.length === 0) return;
    if (!onlyValid && invalidRows.length > 0) {
      alert("Please fix all row validation errors before proceeding with all-or-nothing import.");
      return;
    }

    startTransition(async () => {
      const res = await importProductsCsvAction(validRows);
      if (res.success) {
        setImportSummary(res.message || "Import completed successfully.");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        alert(res.error || "CSV import failed.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Bulk CSV Products Import
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template Download & File Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-900">Need the correct column structure?</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download our CSV template containing required fields and sample apparel variants.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Template</span>
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-2">
            Upload .csv file with UTF-8 encoding. All rows are validated prior to database execution.
          </p>
        </div>

        {/* Feedback alert */}
        {importSummary && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{importSummary}</span>
          </div>
        )}

        {/* Validation Results Overview */}
        {validationResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                Validation Summary: {validationResults.length} rows evaluated
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-medium">
                  &bull; {validRows.length} Valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-rose-700 font-medium">
                    &bull; {invalidRows.length} Invalid
                  </span>
                )}
              </div>
            </div>

            {/* Error List */}
            {invalidRows.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-rose-200 bg-rose-50/50 p-3 space-y-1.5 text-xs text-rose-800">
                <div className="flex items-center gap-1.5 font-semibold text-rose-900 mb-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Validation Issues Detected:</span>
                </div>
                {invalidRows.map((err) => (
                  <div key={err.rowNumber} className="text-[11px]">
                    <strong>Row {err.rowNumber}:</strong> {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          {validationResults && validRows.length > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleCommit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 shadow-2xs"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {invalidRows.length > 0
                  ? `Import ${validRows.length} Valid Rows Only`
                  : `Commit All ${validRows.length} Rows`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
