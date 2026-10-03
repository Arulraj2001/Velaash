"use client";

import React from "react";
import { CreditCard, Banknote, ShieldCheck, AlertCircle } from "lucide-react";

interface PaymentMethodStepProps {
  selectedPaymentMethod: "razorpay" | "cod";
  onChangePaymentMethod: (val: "razorpay" | "cod") => void;
  subtotal: number;
  codEnabled: boolean;
  codMaxOrderValue: number;
  codHandlingFee: number;
  codDisabledDisplayMode?: "hidden" | "blurred";
  razorpayEnabled?: boolean;
}

export function PaymentMethodStep({
  selectedPaymentMethod,
  onChangePaymentMethod,
  subtotal,
  codEnabled,
  codMaxOrderValue,
  codHandlingFee,
  codDisabledDisplayMode = "hidden",
  razorpayEnabled = true,
}: PaymentMethodStepProps) {
  const isCodValueExceeded = subtotal > codMaxOrderValue;
  const isCodAvailable = codEnabled && !isCodValueExceeded;
  const shouldRenderCod = codEnabled || codDisabledDisplayMode === "blurred";

  return (
    <div className="rounded-xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-brand-border/50">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-brand-cream">
          4
        </span>
        <h2 className="font-heading text-base sm:text-lg font-medium text-brand-dark">
          Payment Method
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        {/* 1. Pay Online via Razorpay */}
        <div
          className={`relative rounded-lg border transition-all ${
            !razorpayEnabled
              ? "border-brand-border/50 bg-gray-50/70 opacity-70 cursor-not-allowed"
              : selectedPaymentMethod === "razorpay"
              ? "border-brand-dark bg-brand-cream/30 ring-1 ring-brand-dark cursor-pointer"
              : "border-brand-border/70 hover:border-brand-border bg-white cursor-pointer"
          }`}
        >
          <label
            onClick={() => {
              if (razorpayEnabled) onChangePaymentMethod("razorpay");
            }}
            className="flex items-start justify-between p-4"
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                disabled={!razorpayEnabled}
                checked={selectedPaymentMethod === "razorpay" && razorpayEnabled}
                onChange={() => {
                  if (razorpayEnabled) onChangePaymentMethod("razorpay");
                }}
                className="mt-1 text-brand-dark focus:ring-brand-accent cursor-pointer disabled:cursor-not-allowed"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-dark">
                    Pay Online (UPI / Cards / Netbanking)
                  </span>
                  {razorpayEnabled && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-brand-muted">
                  Instant confirmation via Google Pay, PhonePe, Paytm, Debit/Credit Cards &amp; Netbanking.
                </p>
                {!razorpayEnabled && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Online payments are temporarily paused. Please choose Cash on Delivery.</span>
                  </div>
                )}
              </div>
            </div>
            <CreditCard className="h-5 w-5 text-brand-accent shrink-0 hidden sm:block" />
          </label>
        </div>

        {/* 2. Cash on Delivery (COD) */}
        {shouldRenderCod && (
          <div
            className={`relative rounded-lg border transition-all ${
              !isCodAvailable
                ? "border-brand-border/50 bg-gray-50/70 opacity-70 cursor-not-allowed"
                : selectedPaymentMethod === "cod"
                ? "border-brand-dark bg-brand-cream/30 ring-1 ring-brand-dark cursor-pointer"
                : "border-brand-border/70 hover:border-brand-border bg-white cursor-pointer"
            }`}
          >
            <label
              onClick={() => {
                if (isCodAvailable) {
                  onChangePaymentMethod("cod");
                }
              }}
              className="flex items-start justify-between p-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={selectedPaymentMethod === "cod"}
                  disabled={!isCodAvailable}
                  onChange={() => {
                    if (isCodAvailable) onChangePaymentMethod("cod");
                  }}
                  className="mt-1 text-brand-dark focus:ring-brand-accent cursor-pointer disabled:cursor-not-allowed"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-dark">Cash on Delivery</span>
                    {codHandlingFee > 0 && isCodAvailable && (
                      <span className="text-[11px] text-brand-muted font-medium">
                        (+₹{codHandlingFee} handling fee)
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    Pay in cash to the delivery partner upon arrival at your doorstep.
                  </p>

                  {/* COD Availability Warning */}
                  {!isCodAvailable && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {!codEnabled
                          ? "Cash on Delivery is currently disabled for all orders."
                          : `COD unavailable for orders above ₹${codMaxOrderValue.toLocaleString("en-IN")}.`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Banknote className="h-5 w-5 text-brand-accent shrink-0 hidden sm:block" />
            </label>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-brand-border/40 flex items-center gap-2 text-[11px] text-brand-muted">
        <ShieldCheck className="h-4 w-4 text-brand-accent shrink-0" />
        <span>All transactions are 100% encrypted &amp; verified.</span>
      </div>
    </div>
  );
}
