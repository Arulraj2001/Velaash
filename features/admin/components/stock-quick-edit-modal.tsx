"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import type { AdminProductListItem } from "../types/products";
import { updateProductStockAction } from "../actions/product-actions";
import { Package, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminModal } from "./admin-modal";

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
  isOpen,
  onClose,
  onSuccess,
}: {
  product: AdminProductListItem;
  initialVariants: VariantQuickItem[];
  isOpen: boolean;
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

  const headerIcon = product.thumbnail_url ? (
    <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
      <Image
        src={product.thumbnail_url}
        alt={product.name}
        fill
        sizes="32px"
        className="object-cover"
      />
    </div>
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <Package className="h-4 w-4" />
    </div>
  );

  const footerActions = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 shadow-sm transition-colors"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>Save Stock Changes</span>
      </button>
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      icon={headerIcon}
      title={product.name}
      description={`Total Current Stock: ${currentTotal} units across ${variants.length} variant${
        variants.length === 1 ? "" : "s"
      }`}
      footer={footerActions}
    >
      <div className="space-y-4">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold animate-in fade-in ${
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
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                <th className="px-3.5 py-2.5">Variant</th>
                <th className="px-3.5 py-2.5">SKU</th>
                <th className="px-3.5 py-2.5 text-right">Available Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                    {v.size} &bull; {v.color}
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                    {v.sku}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      value={v.stock_quantity}
                      onChange={(e) =>
                        handleStockChange(v.id, parseInt(e.target.value) || 0)
                      }
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs font-bold font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminModal>
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
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
