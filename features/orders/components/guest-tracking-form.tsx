"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Package,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import {
  trackGuestOrderAction,
  type GuestTrackOrderResult,
} from "../actions/track-guest-order-action";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";
import { CourierTrackingBanner } from "./courier-tracking-banner";

export function GuestTrackingForm() {
  const [orderNumber, setOrderNumber] = React.useState("");
  const [identifier, setIdentifier] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<GuestTrackOrderResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !identifier.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await trackGuestOrderAction(orderNumber, identifier);
      setResult(res);
    } catch {
      setResult({
        success: false,
        error: "We couldn't find a matching order. Please check your details and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOrderNumber("");
    setIdentifier("");
  };

  return (
    <div className="space-y-8">
      {/* Lookup Card (shown when no successful result yet or as a compact top bar) */}
      {!result?.success ? (
        <div className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-10 shadow-sm">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-light/70 text-brand-dark">
                <Search className="h-6 w-6 text-brand-accent" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-brand-dark">
                Track Your Shipment
              </h2>
              <p className="text-xs text-brand-muted leading-relaxed">
                Enter your order number along with the email or mobile number used at checkout to view real-time fulfillment progress.
              </p>
            </div>

            {/* Error Message Alert */}
            {result && !result.success && (
              <div
                role="alert"
                className={`flex items-start gap-3 rounded-xl border p-4 text-xs ${
                  result.isRateLimited
                    ? "border-amber-200 bg-amber-50/80 text-amber-900"
                    : "border-rose-200 bg-rose-50/80 text-rose-900"
                }`}
              >
                <AlertCircle
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    result.isRateLimited ? "text-amber-600" : "text-rose-600"
                  }`}
                />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {result.isRateLimited ? "Too Many Attempts" : "Order Not Found"}
                  </p>
                  <p className="leading-relaxed">{result.error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="track-order-number"
                  className="block text-xs font-semibold text-brand-dark"
                >
                  Order Reference Number <span className="text-brand-accent">*</span>
                </label>
                <input
                  id="track-order-number"
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. VEL-2026-00001"
                  className="w-full rounded-xl border border-brand-border bg-brand-cream/10 px-4 py-2.5 text-xs font-mono text-brand-dark placeholder:text-brand-subtle focus:border-brand-dark focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="track-identifier"
                  className="block text-xs font-semibold text-brand-dark"
                >
                  Checkout Email or Mobile Number <span className="text-brand-accent">*</span>
                </label>
                <input
                  id="track-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. ananya@example.com or 9876543210"
                  className="w-full rounded-xl border border-brand-border bg-brand-cream/10 px-4 py-2.5 text-xs text-brand-dark placeholder:text-brand-subtle focus:border-brand-dark focus:bg-white focus:outline-hidden"
                />
                <p className="text-[11px] text-brand-muted">
                  Used as a secure verification pair to protect your order privacy.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !orderNumber.trim() || !identifier.trim()}
                className="w-full rounded-xl bg-brand-dark py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-accent disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying details...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </form>

            {/* Sign In Reassurance Box */}
            <div className="border-t border-brand-border/60 pt-5 text-center">
              <div className="rounded-xl border border-brand-border/60 bg-brand-light/20 p-4 space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-dark">
                  <UserCheck className="h-4 w-4 text-brand-accent" />
                  <span>Have an account with us?</span>
                </div>
                <p className="text-[11px] text-brand-muted">
                  Sign in to view your complete order history, download tax invoices, and manage addresses in one place.
                </p>
                <Link
                  href="/account/login?returnUrl=/account/orders"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-dark transition-colors underline underline-offset-2 pt-1"
                >
                  Sign in to see full order details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Order Tracking Details View (on successful verification) */
        result.order && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Bar with 'Track another order' button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-dark transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Track another order
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-muted hidden sm:inline">Guest Verification</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Verified
                </span>
              </div>
            </div>

            {/* Header Card */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-brand-dark">
                      #{result.order.orderNumber}
                    </span>
                    <OrderStatusBadge status={result.order.status} size="md" />
                  </div>
                  <p className="text-xs text-brand-muted">
                    Placed on{" "}
                    {new Date(result.order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
                    Order Total
                  </p>
                  <p className="font-heading text-2xl font-semibold text-brand-dark">
                    ₹{result.order.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Order Status Timeline (Reused Component) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Fulfillment Journey
                </h3>
                <OrderTimeline
                  currentStatus={result.order.status}
                  history={result.order.statusHistory}
                  createdAt={result.order.createdAt}
                />
              </div>

              {/* Courier Tracking Details Banner (Reused Component) */}
              {result.order.trackingNumber && (
                <CourierTrackingBanner
                  courierName={result.order.courierName}
                  trackingNumber={result.order.trackingNumber}
                />
              )}
            </div>

            {/* Two Column Layout: Items (Left) & Destination / Masked Privacy (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Items Card */}
              <div className="lg:col-span-2 rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
                  <h3 className="font-heading text-lg font-semibold text-brand-dark">
                    Items in Order ({result.order.items.length})
                  </h3>
                  <span className="text-xs text-brand-muted">Velaash Handcrafted</span>
                </div>

                <div className="divide-y divide-brand-border/60">
                  {result.order.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-start gap-4"
                    >
                      <div className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-brand-cream border border-brand-border/60">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            sizes="72px"
                            className="object-cover object-top"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-brand-subtle">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-semibold text-brand-dark leading-snug">
                          {item.title}
                        </h4>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-brand-muted">
                          <span>Size: <strong>{item.size}</strong></span>
                          <span>&bull;</span>
                          <span>Color: <strong>{item.color}</strong></span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-brand-muted">
                            Qty: <strong>{item.quantity}</strong> &times; ₹{item.unitPrice.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs font-semibold text-brand-dark">
                            ₹{item.subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Masked Destination & Account Prompt Card */}
              <div className="space-y-6">
                {/* Masked Destination Card */}
                <div className="rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-brand-dark font-medium border-b border-brand-border/60 pb-3">
                    <MapPin className="h-4 w-4 text-brand-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Delivery Destination
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs text-brand-muted font-sans leading-relaxed">
                    <p className="font-semibold text-brand-dark text-sm">
                      {result.order.maskedShipping.maskedFullName}
                    </p>
                    <p className="text-brand-subtle italic">
                      •••••••••••••••••••• (Street hidden for privacy)
                    </p>
                    <p className="text-brand-dark font-medium">
                      {result.order.maskedShipping.city}
                      {result.order.maskedShipping.state ? `, ${result.order.maskedShipping.state}` : ""}
                      {result.order.maskedShipping.pincode ? ` – ${result.order.maskedShipping.pincode}` : ""}
                    </p>

                    <div className="pt-2 border-t border-brand-border/40 mt-3 space-y-1 text-[11px]">
                      <p>
                        Phone: <span className="font-mono">{result.order.maskedShipping.maskedPhone}</span>
                      </p>
                      <p>
                        Email: <span className="font-mono">{result.order.maskedShipping.maskedEmail}</span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-brand-cream/60 border border-brand-border/60 p-2.5 text-[11px] text-brand-muted leading-tight mt-3">
                      Full street address is masked to protect guest privacy. Sign in to your account to view complete delivery records and download invoices.
                    </div>
                  </div>
                </div>

                {/* Account Sign-In Card */}
                <div className="rounded-2xl border border-brand-border/80 bg-brand-cream/30 p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                    <UserCheck className="h-4 w-4 text-brand-accent" />
                    <span>Have an account?</span>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Sign in to see full order details, print GST invoices, and track all past purchases.
                  </p>
                  <Link
                    href={`/account/login?returnUrl=/account/orders`}
                    className="inline-flex items-center justify-center w-full rounded-xl bg-white border border-brand-border hover:border-brand-dark py-2.5 text-xs font-semibold text-brand-dark transition-colors shadow-2xs"
                  >
                    Sign in to see full order details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
