"use client";

import React, { useState, useTransition } from "react";
import type { AdminCoupon } from "../types/coupons";
import { deleteCouponAction } from "../actions/coupon-actions";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface CouponDeleteModalProps {
  coupon: AdminCoupon;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (couponId: string) => void;
}

export function CouponDeleteModal({
  coupon,
  isOpen,
  onClose,
  onDeleted,
}: CouponDeleteModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasUsage = coupon.usageCount > 0;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteCouponAction(coupon.id);
      if (res.success) {
        onDeleted(coupon.id);
        onClose();
      } else {
        setError(res.error || "Failed to delete coupon.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-100 p-2.5 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Delete Coupon
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Code: {coupon.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        {/* Warning Body */}
        {hasUsage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Historical Usage Safeguard Notice</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              This coupon has been used in <strong>{coupon.usageCount} order{coupon.usageCount === 1 ? "" : "s"}</strong>.
              Deleting it will not affect past orders (discounts and prices are preserved as permanent snapshots),
              but the code will become invalid for future checkouts immediately.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete coupon code{" "}
            <strong className="font-mono text-slate-900">{coupon.code}</strong>?
            This action cannot be undone.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {isPending ? "Deleting..." : "Confirm & Delete Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}
