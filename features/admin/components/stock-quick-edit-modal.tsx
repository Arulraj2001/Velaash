"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import type { AdminProductListItem } from "../types/products";
import { updateProductStockAction } from "../actions/product-actions";
import { X, Package, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface VariantQuickItem {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
}

interface StockQuickEditModalProps {
  product: AdminProductListItem | null;
  variants: VariantQuickItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function StockQuickEditDialogContent({
  product,
  initialVariants,
  onClose,
  onSuccess,
}: {
  product: AdminProductListItem;
  initialVariants: VariantQuickItem[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [variants, setVariants] = useState<VariantQuickItem[]>(initialVariants);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleStockChange = (variantId: string, newStock: number) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, stock_quantity: Math.max(0, newStock) } : v
      )
    );
  };

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const updates = variants.map((v) => ({
        variantId: v.id,
        stockQuantity: v.stock_quantity,
      }));

      const res = await updateProductStockAction({
        productId: product.id,
        updates,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Stock updated successfully.",
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to update stock.",
        });
      }
    });
  };

  const currentTotal = variants.reduce(
    (sum, v) => sum + Number(v.stock_quantity || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            {product.thumbnail_url ? (
              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 border border-slate-200">
                <Image
                  src={product.thumbnail_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                <Package className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Total Stock: <strong className="text-slate-800">{currentTotal} units</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Variants Stock Table */}
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-semibold text-slate-500">
                <th className="px-3 py-2">Variant</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {v.size} &bull; {v.color}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                    {v.sku}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      value={v.stock_quantity}
                      onChange={(e) =>
                        handleStockChange(v.id, parseInt(e.target.value) || 0)
                      }
                      className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 shadow-2xs"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save Stock Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StockQuickEditModal({
  product,
  variants,
  isOpen,
  onClose,
  onSuccess,
}: StockQuickEditModalProps) {
  if (!isOpen || !product) return null;

  return (
    <StockQuickEditDialogContent
      key={product.id}
      product={product}
      initialVariants={variants}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
