"use client";

import * as React from "react";
import { Truck, Check, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ServiceabilityResponse {
  serviceable: boolean;
  estimatedDays: number | null;
  courierName: string | null;
  codAvailable: boolean;
  isLive: boolean;
  degraded?: boolean;
  error?: string;
}

interface PincodeCheckerProps {
  freeShippingThreshold?: number;
  /** Product weight in grams — passed from PDP to improve rate accuracy */
  productWeightGrams?: number;
  /** Approximate product price — passed for declared value */
  productPrice?: number;
}

export function PincodeChecker({
  freeShippingThreshold = 999,
  productWeightGrams = 500,
  productPrice = 999,
}: PincodeCheckerProps) {
  const [pincode, setPincode] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error" | "unserviceable">("idle");
  const [result, setResult] = React.useState<ServiceabilityResponse | null>(null);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim();

    if (!/^[1-9]\d{5}$/.test(cleanPin)) {
      setStatus("error");
      setErrorMessage("Please enter a valid 6-digit Indian PIN code (digits 1–9).");
      setResult(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        pincode: cleanPin,
        weight: String(productWeightGrams),
        declared_value: String(productPrice),
      });

      const res = await fetch(`/api/shiprocket/serviceability?${params.toString()}`);
      const data: ServiceabilityResponse = await res.json();

      if (!res.ok || !data.serviceable) {
        setStatus("unserviceable");
        setResult(data);
        return;
      }

      setStatus("success");
      setResult(data);
    } catch {
      setStatus("error");
      setErrorMessage("Unable to verify delivery serviceability right now. Please try again or contact us on WhatsApp.");
      setResult(null);
    }
  };

  const formatDeliveryMessage = (data: ServiceabilityResponse, pin: string): string => {
    if (!data.serviceable) {
      return `Sorry, we currently don't deliver to PIN ${pin}. Please contact us on WhatsApp for alternatives.`;
    }
    const dayStr = data.estimatedDays
      ? `in ${data.estimatedDays}–${data.estimatedDays + 2} business days`
      : "within 5–7 business days";
    const courierStr = data.courierName ? ` via ${data.courierName}` : "";
    return `Delivery to ${pin} expected ${dayStr}${courierStr}.`;
  };

  return (
    <div className="border-brand-border/70 bg-brand-light/20 rounded-xl border p-4 font-sans">
      <div className="mb-2.5 flex items-center gap-2">
        <Truck className="text-brand-accent h-4 w-4" />
        <span className="text-brand-dark text-xs font-semibold tracking-wider uppercase">
          Check Delivery Serviceability
        </span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ""));
              if (status !== "idle") {
                setStatus("idle");
                setResult(null);
              }
            }}
            placeholder="Enter 6-digit Pincode (e.g. 560001)"
            className="border-brand-border text-brand-dark placeholder:text-brand-subtle focus:border-brand-accent focus:ring-brand-accent w-full rounded-lg border bg-white px-3.5 py-2 text-xs focus:ring-1 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || pincode.length !== 6}
          className="bg-brand-dark hover:bg-brand-accent disabled:hover:bg-brand-dark flex min-w-[70px] items-center justify-center rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check"}
        </button>
      </form>

      {/* ✅ Serviceable */}
      {status === "success" && result && (
        <div className="animate-in fade-in mt-2.5 space-y-1 duration-200">
          <div className="flex items-start gap-2 text-xs text-emerald-800">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{formatDeliveryMessage(result, pincode)}</span>
          </div>
          {result.codAvailable && (
            <p className="text-brand-muted pl-6 text-[11px]">
              Cash on Delivery available for this location.
            </p>
          )}
          {result.degraded && (
            <p className="text-brand-muted pl-6 text-[11px] italic">
              (Live check unavailable — estimated delivery shown)
            </p>
          )}
        </div>
      )}

      {/* ❌ Unserviceable */}
      {status === "unserviceable" && result && (
        <div className="animate-in fade-in mt-2.5 flex items-start gap-2 text-xs text-rose-700 duration-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{formatDeliveryMessage(result, pincode)}</span>
        </div>
      )}

      {/* ⚠ Validation error */}
      {status === "error" && (
        <div className="animate-in fade-in mt-2.5 flex items-start gap-2 text-xs text-rose-700 duration-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage || "Please enter a valid 6-digit Indian PIN code."}</span>
        </div>
      )}

      {status === "idle" && (
        <p className="text-brand-muted mt-2 text-[11px]">
          Pre-paid orders above {formatCurrency(freeShippingThreshold)} qualify for free delivery.
        </p>
      )}
    </div>
  );
}

