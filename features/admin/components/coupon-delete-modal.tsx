"use client";

import React, { useState, useTransition } from "react";
import type { AdminCoupon } from "../types/coupons";
import { deleteCouponAction } from "../actions/coupon-actions";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { AdminModal } from "./admin-modal";

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

  const footerActions = (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={onClose}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Deleting...</span>
          </>
        ) : (
          <span>Confirm & Delete Coupon</span>
        )}
      </button>
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon={<Trash2 className="h-5 w-5 text-rose-600" />}
      title="Delete Coupon"
      description={`Code: ${coupon.code}`}
      footer={footerActions}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        {hasUsage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Historical Usage Safeguard Notice</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              This coupon has been used in{" "}
              <strong>
                {coupon.usageCount} order{coupon.usageCount === 1 ? "" : "s"}
              </strong>
              . Deleting it will not affect past orders (discounts and prices are preserved as
              permanent snapshots), but the code will become invalid for future checkouts immediately.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete coupon code{" "}
            <strong className="font-mono text-slate-900">{coupon.code}</strong>? This action cannot
            be undone.
          </p>
        )}
      </div>
    </AdminModal>
  );
}
