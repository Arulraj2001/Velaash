"use client";

import * as React from "react";
import { Truck, Check, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PincodeCheckerProps {
  freeShippingThreshold?: number;
}

export function PincodeChecker({ freeShippingThreshold = 999 }: PincodeCheckerProps) {
  const [pincode, setPincode] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim();

    // Indian PIN codes are 6 numeric digits
    if (!/^\d{6}$/.test(cleanPin)) {
      setStatus("error");
      setMessage("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    // Realistic delivery estimation delay
    setTimeout(() => {
      setStatus("success");
      setMessage(`Serviceable location (${cleanPin}). Standard delivery available.`);
    }, 600);
  };

  return (
    <div className="border-brand-border/70 bg-brand-light/20 rounded-xl border p-4 font-sans">
      <div className="mb-2.5 flex items-center gap-2">
        <Truck className="text-brand-gold h-4 w-4" />
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
                setMessage(null);
              }
            }}
            placeholder="Enter 6-digit Pincode (e.g. 560001)"
            className="border-brand-border text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-accent focus:ring-brand-accent w-full rounded-lg border bg-white px-3.5 py-2 text-xs focus:ring-1 focus:outline-none"
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

      {/* Result feedback */}
      {status === "success" && (
        <div className="animate-in fade-in mt-2.5 flex items-start gap-2 text-xs text-emerald-800 duration-200">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {status === "error" && (
        <div className="animate-in fade-in mt-2.5 flex items-start gap-2 text-xs text-rose-700 duration-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{message}</span>
        </div>
      )}

      {status === "idle" && (
        <p className="text-brand-dark/50 mt-2 text-[11px]">
          Pre-paid orders above {formatCurrency(freeShippingThreshold)} qualify for free delivery.
        </p>
      )}
    </div>
  );
}
