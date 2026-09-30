import React from "react";
import { Truck } from "lucide-react";

interface CourierTrackingBannerProps {
  courierName?: string | null;
  trackingNumber: string;
}

export function CourierTrackingBanner({
  courierName,
  trackingNumber,
}: CourierTrackingBannerProps) {
  if (!trackingNumber) return null;

  return (
    <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-indigo-600 text-white p-2.5 shrink-0 shadow-xs">
          <Truck className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
            Dispatched via Courier
          </span>
          <p className="text-sm font-medium text-slate-800">
            Partner:{" "}
            <strong className="text-slate-900 font-semibold">
              {courierName || "Standard Express"}
            </strong>
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-slate-500 font-sans">AWB / Tracking Number:</span>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 select-all">
              {trackingNumber}
            </span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 sm:text-right font-sans">
        Enter this tracking ID on the carrier website for real-time delivery checkpoints.
      </div>
    </div>
  );
}
