"use client";

import React from "react";
import Link from "next/link";
import type { LowStockAlertItem } from "../types";
import { AlertTriangle, ExternalLink, PackageCheck } from "lucide-react";

interface LowStockListProps {
  items: LowStockAlertItem[];
}

export function LowStockList({ items }: LowStockListProps) {
  if (items.length === 0) {
    return (
      <div id="low-stock-section" className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <PackageCheck className="mx-auto h-7 w-7 text-emerald-500" />
        <h4 className="mt-2 text-xs font-semibold text-slate-800">Inventory Healthy</h4>
        <p className="mt-0.5 text-[11px] text-slate-500">
          No variants currently have stock quantities at or below 5 units.
        </p>
      </div>
    );
  }

  return (
    <div id="low-stock-section" className="rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-slate-900 text-xs">Low Stock Inventory Alerts</h3>
        </div>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          {items.length} {items.length === 1 ? "Item" : "Items"} Flagged
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {items.map((item) => {
          const isCritical = item.stockQuantity <= 2;
          const isOutOfStock = item.stockQuantity === 0;

          return (
            <div
              key={item.variantId}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors text-xs"
            >
              <div className="min-w-0 pr-3">
                <p className="font-medium text-slate-900 truncate">{item.productName}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                  <span>Size: {item.size}</span>
                  <span>•</span>
                  <span>Color: {item.color}</span>
                  <span>•</span>
                  <span>SKU: {item.sku}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isOutOfStock
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : isCritical
                      ? "bg-rose-50/80 text-rose-600 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {item.stockQuantity} in stock
                </span>

                <Link
                  href={`/admin/products/${item.productId}`}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  title="Edit product stock"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
