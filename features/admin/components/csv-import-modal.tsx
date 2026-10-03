"use client";

import React, { useState, useTransition } from "react";
import { CsvProductRowSchema, type CsvProductRow } from "../types/products";
import { importProductsCsvAction } from "../actions/product-actions";
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { AdminModal } from "./admin-modal";

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
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      "name,slug,description,category_slug,base_price,is_featured,is_active,size,color,sku,stock_quantity,additional_price\n" +
      "Chanderi Silk Anarkali,chanderi-silk-anarkali,Hand-finished Chanderi silk anarkali,kurtas-sets,4999,true,true,M,Ruby Red,CSA-RED-M,15,0\n" +
      "Chanderi Silk Anarkali,chanderi-silk-anarkali,Hand-finished Chanderi silk anarkali,kurtas-sets,4999,true,true,L,Ruby Red,CSA-RED-L,10,0\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "velaash_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < headers.length) continue;
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSummary(null);
    setImportWarnings([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsedRows = parseCsvText(content);

      const results: RowValidationResult[] = parsedRows.map((raw, idx) => {
        const rowObj = {
          name: raw.name,
          slug: raw.slug,
          description: raw.description,
          category_slug: raw.category_slug,
          base_price: parseFloat(raw.base_price) || 0,
          is_featured: raw.is_featured === "true",
          is_active: raw.is_active === "true",
          size: raw.size,
          color: raw.color,
          sku: raw.sku,
          stock_quantity: parseInt(raw.stock_quantity) || 0,
          additional_price: parseFloat(raw.additional_price) || 0,
        };

        const parsed = CsvProductRowSchema.safeParse(rowObj);
        if (parsed.success) {
          return { rowNumber: idx + 2, data: parsed.data };
        } else {
          return {
            rowNumber: idx + 2,
            data: null,
            error: parsed.error.issues.map((err) => `${err.path.join(".")}: ${err.message}`).join(", "),
          };
        }
      });

      setValidationResults(results);
    };
    reader.readAsText(file);
  };

  const validRows = validationResults ? validationResults.filter((r) => r.data !== null) : [];
  const invalidRows = validationResults ? validationResults.filter((r) => r.data === null) : [];

  const handleCommit = (importValidOnly = false) => {
    if (!validationResults) return;

    const rowsToCommit = importValidOnly
      ? validRows.map((r) => r.data!)
      : validationResults.every((r) => r.data !== null)
      ? validationResults.map((r) => r.data!)
      : [];

    if (rowsToCommit.length === 0) {
      alert("No valid rows available to import.");
      return;
    }

    startTransition(async () => {
      const res = await importProductsCsvAction(rowsToCommit);
      if (res.success) {
        setImportSummary(
          res.message || `Successfully processed and imported ${res.importedCount} rows.`
        );
        if (res.warnings && res.warnings.length > 0) {
          setImportWarnings(res.warnings);
        }
        if (onSuccess) {
          onSuccess();
        }
        if (!res.warnings || res.warnings.length === 0) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        alert(res.error || "CSV import failed.");
      }
    });
  };

  const footerActions = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
      >
        Cancel
      </button>

      {validationResults && validRows.length > 0 && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleCommit(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 shadow-sm transition-colors"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>
            {invalidRows.length > 0
              ? `Import ${validRows.length} Valid Rows Only`
              : `Commit All ${validRows.length} Rows`}
          </span>
        </button>
      )}
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      icon={<FileSpreadsheet className="h-5 w-5 text-indigo-600" />}
      title="Bulk CSV Products Import"
      description="Upload and validate bulk product lines and variants before committing."
      footer={footerActions}
    >
      <div className="space-y-4">
        {/* Template Download & File Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Need the correct column structure?</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download our CSV template containing required fields and sample apparel variants.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Download Template</span>
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-5 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-2">
            Upload .csv file with UTF-8 encoding. All rows are validated prior to database execution.
          </p>
        </div>

        {/* Feedback alert */}
        {importSummary && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{importSummary}</span>
          </div>
        )}

        {/* Warnings from import (e.g. skipped category slugs) */}
        {importWarnings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Import Notice ({importWarnings.length} row(s) skipped):</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              {importWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Results Overview */}
        {validationResults && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800">
                Validation Summary: {validationResults.length} rows evaluated
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold">
                  &bull; {validRows.length} Valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-rose-700 font-bold">
                    &bull; {invalidRows.length} Invalid
                  </span>
                )}
              </div>
            </div>

            {/* Error List with isolated scroll window */}
            {invalidRows.length > 0 && (
              <div className="max-h-48 overflow-y-auto overscroll-contain rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-1.5 text-xs text-rose-800">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Validation Issues Detected:</span>
                </div>
                {invalidRows.map((err) => (
                  <div key={err.rowNumber} className="text-[11px] leading-relaxed">
                    <strong>Row {err.rowNumber}:</strong> {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
