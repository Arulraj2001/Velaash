"use client";

import React from "react";
import { Truck, CheckCircle2 } from "lucide-react";

interface ShippingMethodStepProps {
  isFreeShipping: boolean;
  shippingFee: number;
}

export function ShippingMethodStep({
  isFreeShipping,
  shippingFee,
}: ShippingMethodStepProps) {
  return (
    <div className="rounded-xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-brand-border/50">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-brand-cream">
          3
        </span>
        <h2 className="font-heading text-base sm:text-lg font-medium text-brand-dark">
          Delivery Method
        </h2>
      </div>

      <div className="mt-4">
        {/* Single Standard Delivery Card */}
        <div className="flex items-center justify-between rounded-lg border-2 border-brand-dark bg-brand-cream/30 p-4 transition-all">
          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-white mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-dark">Standard Delivery</span>
                <Truck className="h-4 w-4 text-brand-accent" />
              </div>
              {/* TODO: Replace "5-7 business days" placeholder with real Shiprocket dynamic courier SLA in Phase 3C/3D */}
              <p className="mt-0.5 text-xs text-brand-muted">
                Estimated delivery in 5–7 business days with door-to-door tracking
              </p>
            </div>
          </div>

          <div className="text-right">
            {isFreeShipping ? (
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 tracking-wide">
                FREE
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-brand-dark">
                ₹{shippingFee.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
