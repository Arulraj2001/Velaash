"use client";

import React, { useState } from "react";
import { Truck, RefreshCw, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { refreshShiprocketTrackingAction } from "../actions/refresh-tracking-action";
import type { ShiprocketTrackingResult } from "@/lib/shiprocket";

interface CourierTrackingBannerProps {
  courierName?: string | null;
  trackingNumber: string;
  /**
   * true  → order was dispatched via Shiprocket API (has a shiprocket_order_id).
   *         Shows live "Refresh Status" button that calls Shiprocket tracking API.
   * false → order was manually shipped. Shows a smart external link to the
   *         actual courier's tracking page instead. No API calls made.
   */
  isShiprocketManaged?: boolean;
  /** Pre-fetched live tracking data (SSR pass-through, Shiprocket mode only) */
  initialTracking?: ShiprocketTrackingResult | null;
}

// ─── Courier Tracking URL Map ─────────────────────────────────────────────────
/**
 * Returns the best external tracking URL for a given courier name and AWB.
 * Matched case-insensitively. Falls back to a Google search for unknown couriers
 * so the customer always gets something useful.
 */
function getCourierTrackingUrl(courierName: string | null | undefined, awb: string): string {
  const name = (courierName || "").toLowerCase().trim();

  if (name.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${awb}`;
  }
  if (name.includes("dtdc")) {
    return `https://www.dtdc.in/trace.asp?shipmentid=${awb}`;
  }
  if (name.includes("bluedart") || name.includes("blue dart")) {
    return `https://www.bluedart.com/tracking?trackFor=0&trackNum=${awb}`;
  }
  if (name.includes("ekart")) {
    return `https://ekartlogistics.com/shipmenttrack/${awb}`;
  }
  if (name.includes("india post") || name.includes("speed post") || name.includes("indiapost")) {
    return `https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx`;
  }
  if (name.includes("xpressbees") || name.includes("xpress bees")) {
    return `https://www.xpressbees.com/shipment/tracking/?awbNo=${awb}`;
  }
  if (name.includes("ecom express") || name.includes("ecomexpress")) {
    return `https://ecomexpress.in/tracking/?awb_field=${awb}`;
  }
  if (name.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/?order_number=${awb}`;
  }
  if (name.includes("fedex")) {
    return `https://www.fedex.com/apps/fedextrack/?trknbr=${awb}`;
  }
  if (name.includes("movin") || name.includes("amazon")) {
    return `https://track.amazon.in/tracking/${awb}`;
  }

  // Unknown courier — Google search is always a useful fallback
  return `https://www.google.com/search?q=${encodeURIComponent(awb + " " + (courierName || "") + " tracking")}`;
}

/** User-friendly courier display label for the "Track on X" button */
function getCourierLabel(courierName: string | null | undefined): string {
  const name = (courierName || "").trim();
  if (!name) return "carrier website";
  return name;
}

// ─── Status Colour Helper ─────────────────────────────────────────────────────
function statusColour(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("delivered")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (s.includes("out for delivery")) return "text-blue-700 bg-blue-50 border-blue-200";
  if (s.includes("in transit") || s.includes("transit")) return "text-indigo-700 bg-indigo-50 border-indigo-200";
  if (s.includes("pickup") || s.includes("picked")) return "text-violet-700 bg-violet-50 border-violet-200";
  if (s.includes("rto") || s.includes("return")) return "text-amber-700 bg-amber-50 border-amber-200";
  if (s.includes("cancel") || s.includes("lost")) return "text-rose-700 bg-rose-50 border-rose-200";
  return "text-slate-700 bg-slate-50 border-slate-200";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CourierTrackingBanner({
  courierName,
  trackingNumber,
  isShiprocketManaged = false,
  initialTracking = null,
}: CourierTrackingBannerProps) {
  const [tracking, setTracking] = useState<ShiprocketTrackingResult | null>(initialTracking);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  if (!trackingNumber) return null;

  // ── Shiprocket live refresh handler (only used in Shiprocket mode) ──
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await refreshShiprocketTrackingAction(trackingNumber);
      if (res.success && res.tracking) {
        setTracking(res.tracking);
        setLastRefreshed(new Date());
      } else {
        setRefreshError(res.error ?? "Unable to fetch live status.");
      }
    } catch {
      setRefreshError("Connection error. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const courierTrackingUrl = getCourierTrackingUrl(courierName, trackingNumber);
  const courierLabel = getCourierLabel(courierName);

  return (
    <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white p-4 sm:p-5 space-y-4 shadow-2xs">

      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        {/* ── Right side action: differs by mode ── */}
        <div className="flex items-center gap-2 shrink-0">
          {isShiprocketManaged ? (
            /* SHIPROCKET MODE: live status badge + refresh button */
            <>
              {tracking && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusColour(tracking.currentStatus)}`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {tracking.currentStatus}
                </span>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors shadow-2xs"
                title="Refresh live shipment status from Shiprocket"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing…" : "Refresh Status"}
              </button>
            </>
          ) : (
            /* MANUAL MODE: direct link to the actual courier's tracking page */
            <a
              href={courierTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Track on {courierLabel}
            </a>
          )}
        </div>
      </div>

      {/* ── Live Tracking Details (Shiprocket mode only, shown after first refresh) ── */}
      {isShiprocketManaged && tracking && (
        <div className="border-t border-indigo-100 pt-3 space-y-3">
          {tracking.estimatedDeliveryDate && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>
                Estimated Delivery:{" "}
                <strong className="text-slate-800">{tracking.estimatedDeliveryDate}</strong>
              </span>
            </div>
          )}

          {tracking.activities.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recent Activity
              </span>
              <div className="space-y-1">
                {tracking.activities.slice(0, 4).map((act, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-600 bg-white/60 rounded-lg px-2.5 py-1.5 border border-indigo-50"
                  >
                    <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                    <span className="font-medium text-slate-700">{act.activity}</span>
                    {act.location && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{act.location}</span>
                      </>
                    )}
                    <span className="ml-auto text-slate-400 shrink-0 whitespace-nowrap">{act.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Error State (Shiprocket refresh failures only) ── */}
      {isShiprocketManaged && refreshError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* ── Footer hint ── */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
        {isShiprocketManaged ? (
          <>
            <span>
              {lastRefreshed
                ? `Last refreshed: ${lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                : "Click 'Refresh Status' for live updates from Shiprocket."}
            </span>
            <a
              href={courierTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Track on carrier
            </a>
          </>
        ) : (
          <span className="text-slate-500">
            Use the AWB number above to track your shipment on{" "}
            <a
              href={courierTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors"
            >
              {courierLabel}&apos;s website ↗
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
