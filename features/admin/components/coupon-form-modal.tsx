"use client";

import React, { useState, useTransition, useMemo } from "react";
import type { AdminCoupon, CouponDiscountType, CouponFormData } from "../types/coupons";
import { CouponFormSchema } from "../types/coupons";
import { createCouponAction, updateCouponAction } from "../actions/coupon-actions";
import { calculateCouponDiscount } from "@/features/cart/utils/pricing";
import { formatCurrency } from "@/lib/utils";
import { AdminModal } from "./admin-modal";
import {
  TicketPercent,
  Percent,
  Banknote,
  AlertCircle,
  Calculator,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
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

    const isFlat = discountType === "flat";
    const payload: CouponFormData = {
      code: code.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: isFlat ? null : (maxDiscountAmount ? Number(maxDiscountAmount) : null),
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
        type="submit"
        form="coupon-form"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : isEditing ? (
          <span>Save Changes</span>
        ) : (
          <span>Create Coupon</span>
        )}
      </button>
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      icon={<TicketPercent className="h-5 w-5" />}
      title={
        isEditing
          ? `Edit Coupon: ${coupon?.code}`
          : isDuplicate
          ? "Duplicate Coupon"
          : "Create New Coupon"
      }
      description="Configure promotional code parameters, deduction math, and customer validity periods."
      badge={
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isActive
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {isActive ? "Active Status" : "Disabled"}
        </span>
      }
      footer={footerActions}
    >
      <form id="coupon-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout on Desktop/Tablet, Clean 1-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Core Form Inputs */}
          <div className="lg:col-span-7 space-y-4">
            {/* Coupon Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g. FESTIVE20, WELCOME500"
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm font-mono font-bold tracking-wider text-slate-900 uppercase placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                  Auto-Uppercase
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Letters, numbers, hyphens, and underscores only.
              </p>
            </div>

            {/* Discount Type Radio / Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Discount Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType("percentage");
                    if (Number(discountValue) > 100) setDiscountValue(100);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    discountType === "percentage"
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Percent className="h-4 w-4 text-indigo-600" />
                  Percentage (%)
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType("flat")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    discountType === "flat"
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Banknote className="h-4 w-4 text-indigo-600" />
                  Flat Rupee (₹)
                </button>
              </div>
            </div>

            {/* Discount Value & Max Discount Cap Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
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
                    className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    {discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {discountType === "percentage"
                    ? "Max 100% off cart total"
                    : "Direct deduction in Rupees"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Max Discount Cap (₹){" "}
                  {discountType === "flat" && (
                    <span className="text-[10px] font-normal text-slate-400">(N/A for flat)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    disabled={discountType === "flat"}
                    value={discountType === "flat" ? "" : maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder={
                      discountType === "flat"
                        ? "Not applicable"
                        : "e.g. 500 (blank = uncapped)"
                    }
                    className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {discountType === "flat"
                    ? "Flat deductions apply unconditionally."
                    : "Upper limit for percentage deductions."}
                </p>
              </div>
            </div>

            {/* Min Order Value & Usage Limit Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
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
                    className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimum cart total to trigger code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Leave blank for unlimited"
                  className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Total redemption count allowed globally.
                </p>
              </div>
            </div>

            {/* Date Range Picker Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Valid From <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Valid Until <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Status & Live Math Engine */}
          <div className="lg:col-span-5 space-y-4">
            {/* Active Status Switch Card */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="pr-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Enable Coupon
                </span>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Live immediately once Valid From date arrives.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* LIVE PREVIEW SANITY-CHECK CARD */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Calculator className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Live Math Preview</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-white/90 px-2 py-0.5 rounded-md border border-indigo-200">
                  Real-time
                </span>
              </div>

              <div className="space-y-2 rounded-xl bg-white/80 p-3 border border-indigo-100/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Test Cart Subtotal:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={previewSubtotal}
                      onChange={(e) => setPreviewSubtotal(Math.max(0, Number(e.target.value)))}
                      className="w-24 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 font-mono text-right focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Calculated Discount:</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    -{formatCurrency(previewDiscount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-indigo-100 pt-2">
                  <span className="text-slate-900 font-bold">Customer Pays:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(Math.max(0, previewSubtotal - previewDiscount))}
                  </span>
                </div>
              </div>

              {/* Explanatory status text */}
              <div className="rounded-xl bg-white/90 p-2.5 text-[11px] text-slate-700 border border-indigo-100 leading-snug">
                {isBelowMin ? (
                  <span className="text-amber-700 font-medium flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>
                      Cart (₹{previewSubtotal}) is below minimum (₹{minOrderValue}) → ₹0 discount.
                    </span>
                  </span>
                ) : isCapped ? (
                  <span className="text-indigo-800 font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>
                      Standard {discountValue}% would be ₹{rawPercentageCut.toFixed(0)}, but capped at ₹{maxDiscountAmount}.
                    </span>
                  </span>
                ) : (
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Valid discount: customer saves ₹{previewDiscount} on this order.
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Helper Guideline */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Checkout Rules</span>
              </div>
              <p className="leading-relaxed">
                Single-coupon checkout enforcement applies across desktop and mobile. Code changes are reflected immediately upon save.
              </p>
            </div>
          </div>
        </div>
      </form>
    </AdminModal>
  );
}
