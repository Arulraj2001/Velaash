"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Tag,
  X,
  Truck,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import type { AppliedCoupon, ShippingPolicyData } from "../types";
import { calculateCartTotals } from "../utils/pricing";
import type { CartItem } from "../types";

interface CartOrderSummaryProps {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  onApplyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveCoupon: () => void;
  shippingPolicy: ShippingPolicyData;
  returnWindowDays: number;
  hasUnavailableItems: boolean;
  requireSignInToOrder?: boolean;
}

export function CartOrderSummary({
  items,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  shippingPolicy,
  returnWindowDays,
  hasUnavailableItems,
  requireSignInToOrder = false,
}: CartOrderSummaryProps) {
  const { isAuthenticated } = useAuth();
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "error" | "success" | null;
    message: string | null;
  }>({ type: null, message: null });

  // Calculate live totals using the shared pricing engine
  const calculation = calculateCartTotals({
    items,
    appliedCoupon,
    shippingPolicy,
  });

  const {
    subtotal,
    discount,
    shippingFee,
    isFreeShipping,
    freeShippingBadgeText,
    amountNeededForFreeShipping,
    freeShippingProgress,
    total,
  } = calculation;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || isSubmittingCoupon) return;

    setIsSubmittingCoupon(true);
    setCouponFeedback({ type: null, message: null });

    const result = await onApplyCoupon(couponCodeInput.trim());
    setIsSubmittingCoupon(false);

    if (result.success) {
      setCouponCodeInput("");
      setCouponFeedback({
        type: "success",
        message: "Coupon applied successfully!",
      });
    } else {
      setCouponFeedback({
        type: "error",
        message: result.error || "Failed to apply coupon.",
      });
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponFeedback({ type: null, message: null });
  };

  return (
    <div className="rounded-xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-brand-dark tracking-tight">
        Order Summary
      </h2>

      {/* 1. Free Shipping Progress Bar */}
      <div className="mt-4 rounded-lg bg-brand-light/70 p-3.5 border border-brand-border/60">
        <div className="flex items-center gap-2 text-xs font-medium text-brand-dark">
          <Truck className="h-4 w-4 text-brand-accent shrink-0" />
          {isFreeShipping ? (
            <span className="text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline shrink-0" />
              You&apos;ve unlocked free standard shipping!
            </span>
          ) : (
            <span>
              Add <span className="font-semibold text-brand-dark">₹{amountNeededForFreeShipping.toLocaleString("en-IN")}</span> more for free shipping
            </span>
          )}
        </div>

        {/* Progress Bar Track */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-border/50">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFreeShipping ? "bg-emerald-600" : "bg-brand-accent"
            }`}
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* 2. Subtotal & Breakdown */}
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between text-brand-muted">
          <span>Subtotal</span>
          <span className="font-medium text-brand-dark">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {/* Applied Coupon Row */}
        {appliedCoupon && (
          <div className="flex justify-between items-center text-emerald-800 font-medium bg-emerald-50/80 px-2.5 py-1.5 rounded border border-emerald-200 text-xs">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              Coupon ({appliedCoupon.code})
            </span>
            <div className="flex items-center gap-2">
              <span>-₹{discount.toLocaleString("en-IN")}</span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded transition-colors"
                title="Remove coupon"
                aria-label="Remove coupon"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Shipping Fee */}
        <div className="flex justify-between text-brand-muted">
          <span>Standard Shipping</span>
          {isFreeShipping ? (
            <div className="text-right">
              <span className="font-semibold text-emerald-700 tracking-wide">FREE</span>
              {freeShippingBadgeText && (
                <p className="text-[10px] text-emerald-600 font-medium">
                  {freeShippingBadgeText}
                </p>
              )}
            </div>
          ) : (
            <span className="font-medium text-brand-dark">
              ₹{shippingFee.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Total Divider */}
        <div className="border-t border-brand-border/80 pt-3 flex justify-between items-baseline">
          <span className="font-heading text-base font-semibold text-brand-dark">Estimated Total</span>
          <div className="text-right">
            <span className="font-heading text-xl font-bold text-brand-dark">
              ₹{total.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] text-brand-muted mt-0.5">Inclusive of all taxes</p>
          </div>
        </div>
      </div>

      {/* 3. Coupon Code Input */}
      <div className="mt-6 border-t border-brand-border/60 pt-5">
        <label htmlFor="coupon-code-input" className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
          Have a coupon?
        </label>
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input
            id="coupon-code-input"
            type="text"
            value={couponCodeInput}
            onChange={(e) => {
              setCouponCodeInput(e.target.value.toUpperCase());
              if (couponFeedback.type) setCouponFeedback({ type: null, message: null });
            }}
            placeholder="Enter coupon code"
            disabled={isSubmittingCoupon || Boolean(appliedCoupon)}
            className="flex-1 rounded-none border border-brand-border/80 bg-white px-3 py-2 text-xs uppercase placeholder:normal-case placeholder:text-brand-subtle focus:border-brand-dark focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!couponCodeInput.trim() || isSubmittingCoupon || Boolean(appliedCoupon)}
            className="inline-flex items-center justify-center rounded-none bg-brand-dark px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-cream transition-colors hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmittingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        </form>

        {/* Feedback / Error Message */}
        {couponFeedback.message && (
          <div
            className={`mt-2 flex items-start gap-1.5 text-xs p-2 rounded ${
              couponFeedback.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {couponFeedback.type === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <span className="flex-1">{couponFeedback.message}</span>
          </div>
        )}
      </div>

      {/* 4. Checkout CTA */}
      <div className="mt-6">
        {hasUnavailableItems && (
          <p className="mb-2 text-center text-xs font-medium text-red-600">
            Please remove unavailable items before proceeding.
          </p>
        )}

        {hasUnavailableItems ? (
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-2 rounded-none bg-brand-dark/40 py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-cream cursor-not-allowed"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div>
            <Link
              href={
                requireSignInToOrder && !isAuthenticated
                  ? "/account/login?returnUrl=/checkout"
                  : "/checkout"
              }
              className="w-full flex items-center justify-center gap-2 rounded-none bg-brand-dark py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-cream transition-all duration-300 hover:bg-brand-accent hover:shadow-md"
            >
              <span>
                {requireSignInToOrder && !isAuthenticated
                  ? "Sign In to Checkout"
                  : "Proceed to Checkout"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {requireSignInToOrder && !isAuthenticated && (
              <p className="mt-2 text-center text-[11px] text-brand-muted">
                Sign-in required to place order &bull; Shopping bag is saved
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. Trust Badges Row */}
      <div className="mt-6 border-t border-brand-border/60 pt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-[11px] text-brand-muted">
          <ShieldCheck className="h-4 w-4 text-brand-accent shrink-0" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-brand-muted">
          <RotateCcw className="h-4 w-4 text-brand-accent shrink-0" />
          <span>{returnWindowDays}-Day Easy Returns</span>
        </div>
      </div>
    </div>
  );
}
