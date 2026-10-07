"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ShieldCheck,
  Clock,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  ArrowRight,
  Info,
  Sparkles,
  ArrowLeftRight,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatDateTimeIST } from "@/lib/utils";
import type { RefundStatus } from "../types";

export interface CancellationRefundCardProps {
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  refundStatus?: RefundStatus | null;
  refundAmount?: number | null;
  refundArn?: string | null;
  razorpayRefundId?: string | null;
  refundedAt?: string | null;
  whatsappUrl: string;
}

export function CancellationRefundCard({
  orderNumber,
  totalAmount,
  paymentMethod,
  paymentStatus,
  refundStatus,
  refundAmount,
  refundArn,
  razorpayRefundId,
  refundedAt,
  whatsappUrl,
}: CancellationRefundCardProps) {
  const [copied, setCopied] = useState(false);

  const isCod = paymentMethod === "cod";
  const displayAmount = refundAmount || totalAmount;
  const isProcessed = refundStatus === "processed";
  const isFailed = refundStatus === "failed";
  const isInitiated = refundStatus === "initiated" || paymentStatus === "refunded";
  const isPendingReview =
    refundStatus === "pending_review" ||
    (!isProcessed && !isFailed && !isInitiated && !isCod);

  const referenceId = razorpayRefundId || refundArn || null;

  const handleCopyReference = () => {
    if (!referenceId) return;
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedRefundDate = refundedAt
    ? formatDateTimeIST(refundedAt)
    : null;

  // Custom WhatsApp deep link for resolution choice
  const conciergeMessage = encodeURIComponent(
    `Hi Velaash Care, I cancelled prepaid order #${orderNumber} (₹${displayAmount.toLocaleString(
      "en-IN"
    )}). Please assist me with size replacement / store credit / refund.`
  );
  const resolvedWhatsappUrl = whatsappUrl.includes("?")
    ? `${whatsappUrl.split("?")[0]}?text=${conciergeMessage}`
    : `${whatsappUrl}?text=${conciergeMessage}`;

  if (isCod) {
    return (
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light/50 text-brand-dark">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-brand-dark">
              No Payment Collected
            </h3>
            <p className="text-xs text-brand-muted">
              This order was placed under Cash on Delivery (COD). No money was charged or collected from you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-border/80 bg-white shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div
        className={cn(
          "p-6 border-b transition-colors",
          isProcessed
            ? "bg-emerald-50/70 border-emerald-100"
            : isFailed
            ? "bg-amber-50/70 border-amber-100"
            : isInitiated
            ? "bg-emerald-50/50 border-emerald-100"
            : "bg-gradient-to-r from-brand-cream/80 via-white to-brand-cream/50 border-brand-border/60"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm",
                isProcessed || isInitiated
                  ? "bg-emerald-600 text-white"
                  : isFailed
                  ? "bg-amber-600 text-white"
                  : "bg-brand-dark text-brand-gold"
              )}
            >
              {isProcessed ? (
                <ShieldCheck className="h-6 w-6" />
              ) : isFailed ? (
                <AlertCircle className="h-6 w-6" />
              ) : isInitiated ? (
                <RotateCcw className="h-6 w-6 stroke-[2.2]" />
              ) : (
                <ArrowLeftRight className="h-6 w-6 stroke-[2]" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-heading text-lg font-semibold text-brand-dark">
                  {isProcessed
                    ? "Refund Settled"
                    : isFailed
                    ? "Refund Action Required"
                    : isInitiated
                    ? "Refund Dispatched by Store"
                    : "Cancellation Confirmed"}
                </h3>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                    isProcessed
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : isFailed
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : isInitiated
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-brand-gold/20 text-brand-dark border-brand-gold/40"
                  )}
                >
                  {isProcessed
                    ? "Settled to Bank"
                    : isFailed
                    ? "Under Review"
                    : isInitiated
                    ? "Processing with Gateway"
                    : "Resolution Review"}
                </span>
              </div>
              <p className="text-xs text-brand-muted">
                {isProcessed
                  ? "Amount credited back to your original payment source account."
                  : isInitiated
                  ? "A manual refund has been initiated by the store with Razorpay."
                  : "Items restocked. Per store policy, replacement or store credit is prioritized."}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
              Order Value
            </p>
            <p className="font-heading text-2xl font-bold text-brand-dark">
              ₹{displayAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* State A: Resolution Review (Replacement-First Options) */}
        {isPendingReview && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Available Resolutions
              </h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                As an artisanal ethnic fashion house, we prioritize doorstep replacements and size exchanges so you get the perfect fit without waiting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Option 1: Doorstep Replacement */}
              <div className="p-4 rounded-xl border-2 border-brand-gold/40 bg-brand-cream/30 space-y-2 relative">
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/30 text-brand-dark">
                  Recommended
                </span>
                <div className="flex items-center gap-2 text-brand-dark font-semibold text-xs">
                  <ArrowLeftRight className="h-4 w-4 text-brand-accent shrink-0" />
                  <span>Size Exchange / Replacement</span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Ordered the wrong size or piece? Connect with our concierge to dispatch your desired size with priority express courier.
                </p>
              </div>

              {/* Option 2: Store Credit */}
              <div className="p-4 rounded-xl border border-brand-border/80 bg-white space-y-2">
                <div className="flex items-center gap-2 text-brand-dark font-semibold text-xs">
                  <Sparkles className="h-4 w-4 text-brand-accent shrink-0" />
                  <span>Instant Store Credit</span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Receive an instant shopping voucher for ₹{displayAmount.toLocaleString("en-IN")} with zero expiry date to pick any alternative.
                </p>
              </div>

              {/* Option 3: Monetary Refund (Rare Exception) */}
              <div className="p-4 rounded-xl border border-brand-border/80 bg-white space-y-2">
                <div className="flex items-center gap-2 text-brand-dark font-semibold text-xs">
                  <CreditCard className="h-4 w-4 text-brand-muted shrink-0" />
                  <span>Monetary Refund (Under Review)</span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Refunds are rare exceptions reviewed by our store manager. Connect with our team to verify and process your Razorpay reversal.
                </p>
              </div>
            </div>

            {/* Quick Action Strip */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-light/20 p-4 rounded-xl border border-brand-border/60">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-brand-dark">
                  Connect with our Care Concierge
                </p>
                <p className="text-[11px] text-brand-muted">
                  Share your Order ID to confirm your replacement size or refund request.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={resolvedWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    leftIcon={<MessageCircle className="h-4 w-4 text-emerald-400" />}
                  >
                    Connect on WhatsApp
                  </Button>
                </a>
                <Link href="/shipping-returns" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                  >
                    View Policy
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* State B: Refund Initiated or Processed (Visual Progress Tracker) */}
        {(isInitiated || isProcessed || isFailed) && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-4">
              Reversal Progress
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Step 1: Cancellation & Request */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-light/20 border border-brand-border/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-brand-dark">Order Cancelled</p>
                  <p className="text-[11px] text-brand-muted">
                    Cancellation recorded & stock restored
                  </p>
                </div>
              </div>

              {/* Step 2: Gateway Reversal */}
              <div
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border",
                  isInitiated || isProcessed
                    ? "bg-emerald-50/60 border-emerald-200"
                    : isFailed
                    ? "bg-amber-50/60 border-amber-200"
                    : "bg-brand-light/10 border-brand-border/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isInitiated || isProcessed
                      ? "bg-emerald-600 text-white"
                      : isFailed
                      ? "bg-amber-600 text-white"
                      : "bg-brand-muted text-white"
                  )}
                >
                  {isInitiated || isProcessed ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-brand-dark">Refund Initiated</p>
                  <p className="text-[11px] text-brand-muted">
                    Lodged with Razorpay by store
                  </p>
                </div>
              </div>

              {/* Step 3: Bank Statement Credit */}
              <div
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border",
                  isProcessed
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-brand-cream/40 border-brand-border/70"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isProcessed
                      ? "bg-emerald-600 text-white"
                      : "border-2 border-brand-gold bg-brand-gold/10 text-brand-accent"
                  )}
                >
                  {isProcessed ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <Clock className="h-4 w-4 stroke-[2.2]" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-brand-dark">
                    {isProcessed ? "Credited to Bank" : "Bank Credit in 5–7 Days"}
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {isProcessed
                      ? "Funds reflected in your account"
                      : "Inter-bank clearing timeline"}
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-brand-border/60 text-xs">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
                  Payment Source
                </span>
                <p className="font-semibold text-brand-dark mt-0.5">
                  Original Method (UPI/Card/Bank)
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
                  Expected Credit
                </span>
                <p className="font-semibold text-brand-dark mt-0.5">
                  {isProcessed ? "Already Credited" : "5–7 Business Days"}
                </p>
              </div>

              {referenceId && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
                    Refund Reference ID
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="bg-brand-cream font-mono px-2 py-0.5 rounded text-[11px] text-brand-dark border border-brand-border/60">
                      {referenceId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyReference}
                      className="text-brand-muted hover:text-brand-accent p-1 transition-colors"
                      title="Copy reference ID"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & Support Guarantee Footer */}
        <div className="rounded-xl bg-brand-light/20 p-4 border border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-brand-dark flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Quality &amp; Care Assurance
            </p>
            <p className="text-[11px] text-brand-muted leading-relaxed max-w-xl">
              Because your order was cancelled before dispatch, no cancellation fee was charged. For size adjustments, color swaps, or rare refund inquiries, our WhatsApp team is standing by.
            </p>
          </div>

          <a
            href={resolvedWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs"
              leftIcon={<MessageCircle className="h-3.5 w-3.5 text-emerald-600" />}
            >
              Support Inquiry
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
