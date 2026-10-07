"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, RotateCcw, Lock, Loader2, Tag, ArrowRight } from "lucide-react";
import type { CartItem, AppliedCoupon } from "@/features/cart/types";

interface OrderReviewSidebarProps {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  isFreeShipping: boolean;
  codFee: number;
  paymentMethod: "razorpay" | "cod";
  totalAmount: number;
  isSubmitting: boolean;
  returnWindowDays: number;
  freeShippingBadgeText?: string | null;
}

export function OrderReviewSidebar({
  items,
  appliedCoupon,
  subtotal,
  discount,
  shippingFee,
  isFreeShipping,
  codFee,
  paymentMethod,
  totalAmount,
  isSubmitting,
  returnWindowDays,
  freeShippingBadgeText,
}: OrderReviewSidebarProps) {
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="rounded-xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
        <h2 className="font-heading text-lg font-semibold text-brand-dark tracking-tight">
          Order Summary
        </h2>
        <span className="text-xs text-brand-muted font-medium">
          {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* 1. Compact Line Items List */}
      <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-brand-border/40 pr-1">
        {items.map((item) => (
          <div key={item.id} className="py-3 flex items-start gap-3">
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-brand-light border border-brand-border/60">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-top"
                sizes="48px"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-heading text-xs font-semibold text-brand-dark truncate">
                {item.title}
              </p>
              <p className="text-[11px] text-brand-muted mt-0.5">
                {[
                  item.color || null,
                  item.size ? `Size ${item.size}` : null,
                  `Qty ${item.quantity}`,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              <p className="text-xs font-semibold text-brand-dark mt-1">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Price Breakdown */}
      <div className="mt-5 pt-4 border-t border-brand-border/60 space-y-2.5 text-xs">
        <div className="flex justify-between text-brand-muted">
          <span>Subtotal</span>
          <span className="font-medium text-brand-dark">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {/* Applied Coupon Discount */}
        {appliedCoupon && discount > 0 && (
          <div className="flex justify-between items-center text-emerald-800 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Coupon ({appliedCoupon.code})
            </span>
            <span>-₹{discount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Shipping Fee */}
        <div className="flex justify-between text-brand-muted">
          <span>Standard Delivery</span>
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
            <span className="font-medium text-brand-dark">₹{shippingFee.toLocaleString("en-IN")}</span>
          )}
        </div>

        {/* COD Handling Fee */}
        {paymentMethod === "cod" && codFee > 0 && (
          <div className="flex justify-between text-brand-muted">
            <span>COD Handling Fee</span>
            <span className="font-medium text-brand-dark">₹{codFee.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Total Divider */}
        <div className="border-t border-brand-border/80 pt-3 flex justify-between items-baseline">
          <span className="font-heading text-sm font-semibold text-brand-dark">Order Total</span>
          <div className="text-right">
            <span className="font-heading text-lg font-bold text-brand-dark">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] text-brand-muted">Inclusive of all taxes</p>
          </div>
        </div>
      </div>

      {/* 3. Place Order Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-none bg-brand-dark py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-cream transition-all duration-300 hover:bg-brand-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing Order...</span>
            </>
          ) : paymentMethod === "cod" ? (
            <>
              <Lock className="h-3.5 w-3.5 text-brand-accent" />
              <span>Place Order (Pay on Delivery)</span>
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-brand-accent" />
              <span>Pay ₹{totalAmount.toLocaleString("en-IN")}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="mt-2 text-center text-[10px] text-brand-muted">
          By clicking Place Order, you agree to our Terms of Sale.
        </p>
      </div>

      {/* Edit Bag Link */}
      <div className="mt-4 pt-3 border-t border-brand-border/50 text-center">
        <Link
          href="/cart"
          className="text-xs font-semibold text-brand-muted hover:text-brand-dark underline underline-offset-4 transition-colors"
        >
          Modify items in bag
        </Link>
      </div>

      {/* 4. Trust Badges Row */}
      <div className="mt-6 border-t border-brand-border/60 pt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-[11px] text-brand-muted">
          <ShieldCheck className="h-4 w-4 text-brand-accent shrink-0" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-brand-muted">
          <RotateCcw className="h-4 w-4 text-brand-accent shrink-0" />
          <span>{returnWindowDays}-Day Easy Replacement</span>
        </div>
      </div>
    </div>
  );
}
