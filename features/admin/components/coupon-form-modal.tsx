"use client";

import React, { useState, useTransition, useMemo } from "react";
import type { AdminCoupon, CouponDiscountType, CouponFormData } from "../types/coupons";
import { CouponFormSchema } from "../types/coupons";
import { createCouponAction, updateCouponAction } from "../actions/coupon-actions";
import { calculateCouponDiscount } from "@/features/cart/utils/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  TicketPercent,
  X,
  Percent,
  Banknote,
  AlertCircle,
  Calculator,
} from "lucide-react";

interface CouponFormModalProps {
  coupon?: AdminCoupon | null;
  isDuplicate?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedCoupon: AdminCoupon) => void;
}

export function CouponFormModal({
  coupon,
  isDuplicate = false,
  isOpen,
  onClose,
  onSaved,
}: CouponFormModalProps) {
  const isEditing = Boolean(coupon && !isDuplicate);

  // Initial code: uppercase, or if duplicate, append '_COPY'
  const initialCode = useMemo(() => {
    if (!coupon) return "";
    if (isDuplicate) return `${coupon.code}_COPY`.toUpperCase();
    return coupon.code.toUpperCase();
  }, [coupon, isDuplicate]);

  // Format date helper for datetime-local input
  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Default dates: now and 30 days from now
  const defaultValidFrom = useMemo(() => {
    return formatDateForInput(coupon?.validFrom || new Date().toISOString());
  }, [coupon]);

  const defaultValidUntil = useMemo(() => {
    if (coupon?.validUntil) return formatDateForInput(coupon.validUntil);
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return formatDateForInput(future.toISOString());
  }, [coupon]);

  // Form State
  const [code, setCode] = useState(initialCode);
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discountType || "percentage"
  );
  const [discountValue, setDiscountValue] = useState<number | string>(
    coupon?.discountValue ?? 10
  );
  const [minOrderValue, setMinOrderValue] = useState<number | string>(
    coupon?.minOrderValue ?? 0
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>(
    coupon?.maxDiscountAmount ?? ""
  );
  const [usageLimit, setUsageLimit] = useState<number | string>(
    coupon?.usageLimit ?? ""
  );
  const [validFrom, setValidFrom] = useState(defaultValidFrom);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [isActive, setIsActive] = useState<boolean>(
    coupon ? coupon.isActive : true
  );

  // Live Preview interactive test cart value
  const [previewSubtotal, setPreviewSubtotal] = useState<number>(2000);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Handle uppercase code entry live as user types
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip illegal characters and auto-uppercase immediately
    const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    setCode(upper);
  };

  // Handle discount value change with percentage cap enforcement
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setDiscountValue("");
      return;
    }
    const num = Number(raw);
    if (isNaN(num)) return;

    if (discountType === "percentage") {
      // Percentage cap at 100
      setDiscountValue(Math.min(100, Math.max(0, num)));
    } else {
      setDiscountValue(Math.max(0, num));
    }
  };

  // Compute live discount preview using the authoritative shared calculateCouponDiscount
  const previewDiscount = useMemo(() => {
    const val = Number(discountValue) || 0;
    const minVal = Number(minOrderValue) || 0;
    const maxCap = maxDiscountAmount ? Number(maxDiscountAmount) : null;

    return calculateCouponDiscount(
      {
        discountType,
        discountValue: val,
        minOrderValue: minVal,
        maxDiscountAmount: maxCap,
      },
      previewSubtotal
    );
  }, [discountType, discountValue, minOrderValue, maxDiscountAmount, previewSubtotal]);

  const rawPercentageCut =
    discountType === "percentage"
      ? (previewSubtotal * (Number(discountValue) || 0)) / 100
      : Number(discountValue) || 0;

  const isCapped =
    discountType === "percentage" &&
    maxDiscountAmount &&
    rawPercentageCut > Number(maxDiscountAmount);

  const isBelowMin = previewSubtotal < (Number(minOrderValue) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CouponFormData = {
      code: code.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      isActive,
    };

    const parsed = CouponFormSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Validation failed.");
      return;
    }

    startTransition(async () => {
      let res;
      if (isEditing && coupon) {
        res = await updateCouponAction(coupon.id, parsed.data);
      } else {
        res = await createCouponAction(parsed.data);
      }

      if (res.success) {
        const dummySaved: AdminCoupon = {
          id: res.couponId || coupon?.id || "temp-id",
          code: parsed.data.code,
          discountType: parsed.data.discountType,
          discountValue: parsed.data.discountValue,
          minOrderValue: parsed.data.minOrderValue || 0,
          maxDiscountAmount: parsed.data.maxDiscountAmount || null,
          usageLimit: parsed.data.usageLimit || null,
          usageCount: isEditing && coupon ? coupon.usageCount : 0,
          validFrom: parsed.data.validFrom,
          validUntil: parsed.data.validUntil,
          isActive: parsed.data.isActive,
          createdAt: coupon?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          computedStatus: parsed.data.isActive ? "active" : "inactive",
          ordersCount: isEditing && coupon ? coupon.ordersCount : 0,
        };
        onSaved(dummySaved);
        onClose();
      } else {
        setError(res.error || "Failed to save coupon.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <TicketPercent className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? "Edit Coupon" : isDuplicate ? "Duplicate Coupon" : "Create New Coupon"}
              </h2>
              <p className="text-xs text-slate-500">
                Configure promotional code parameters, deduction math, and validity dates.
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
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coupon Code Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Coupon Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. FESTIVE20, WELCOME500"
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm font-mono font-bold tracking-wider text-slate-900 uppercase placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 uppercase font-mono">
                Auto-Uppercase
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Letters, numbers, hyphens, and underscores only. Automatically uppercased as you type.
            </p>
          </div>

          {/* Discount Type Radio / Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Discount Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountType("percentage");
                  if (Number(discountValue) > 100) setDiscountValue(100);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                  discountType === "percentage"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Percent className="h-4 w-4 text-indigo-600" />
                Percentage Discount (%)
              </button>

              <button
                type="button"
                onClick={() => setDiscountType("flat")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                  discountType === "flat"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="h-4 w-4 text-indigo-600" />
                Flat Deduction (₹)
              </button>
            </div>
          </div>

          {/* Discount Value & Max Discount Cap Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Discount Value <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max={discountType === "percentage" ? 100 : undefined}
                  step={discountType === "percentage" ? "1" : "50"}
                  value={discountValue}
                  onChange={handleDiscountValueChange}
                  placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                  {discountType === "percentage" ? "%" : "₹"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {discountType === "percentage"
                  ? "Percentage off cart total (capped at 100%)"
                  : "Fixed rupee amount deducted from total"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Max Discount Amount (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="e.g. 500 (blank = uncapped)"
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                  ₹
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Upper ceiling for percentage cuts (e.g. 20% off up to ₹500).
              </p>
            </div>
          </div>

          {/* Min Order Value & Usage Limit Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Min. Order Subtotal (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="0 (no minimum requirement)"
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                  ₹
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Minimum cart value required before coupon can be applied.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Blank or 0 = Unlimited"
                className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Max total times this code can be redeemed across all customers.
              </p>
            </div>
          </div>

          {/* Date Range Picker Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Valid From <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Valid Until <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div>
              <span className="text-xs font-semibold text-slate-900">
                Enable Coupon Immediately
              </span>
              <p className="text-[11px] text-slate-500">
                Active coupons become usable as soon as the Valid From date arrives.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* LIVE PREVIEW SANITY-CHECK CARD */}
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950">
                <Calculator className="h-4 w-4 text-indigo-600" />
                <span>Live Discount Math Preview</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                Authoritative Checkout Engine
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Test Order Subtotal:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-slate-500">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={previewSubtotal}
                    onChange={(e) => setPreviewSubtotal(Math.max(0, Number(e.target.value)))}
                    className="w-20 rounded border border-indigo-200 bg-white px-1.5 py-0.5 text-xs font-bold text-slate-900 font-mono text-right focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Calculated Discount:</span>
                <span className="font-mono font-bold text-emerald-600">
                  -{formatCurrency(previewDiscount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-indigo-100 pt-1.5">
                <span className="text-slate-900 font-semibold">Final Customer Pays:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(Math.max(0, previewSubtotal - previewDiscount))}
                </span>
              </div>
            </div>

            {/* Explanatory status text */}
            <div className="rounded bg-white/80 p-2 text-[11px] text-slate-600 border border-indigo-100 leading-tight">
              {isBelowMin ? (
                <span className="text-amber-700 font-medium">
                  ⚠️ Subtotal (₹{previewSubtotal}) is below minimum requirement (₹{minOrderValue}) → ₹0 discount.
                </span>
              ) : isCapped ? (
                <span className="text-indigo-800">
                  ✨ Standard {discountValue}% would be ₹{rawPercentageCut}, but discount is capped at ₹{maxDiscountAmount} max.
                </span>
              ) : (
                <span className="text-emerald-800">
                  ✓ On a ₹{previewSubtotal} order, this coupon provides ₹{previewDiscount} off.
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
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
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isPending
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
