"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
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
  const isInitiated =
    refundStatus === "initiated" ||
    paymentStatus === "refunded" ||
    (!isProcessed && !isFailed && !isCod);

  const referenceId = razorpayRefundId || refundArn || null;

  const handleCopyReference = () => {
    if (!referenceId) return;
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedRefundDate = refundedAt
    ? new Date(refundedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
      <div className={cn(
        "p-6 border-b transition-colors",
        isProcessed
          ? "bg-emerald-50/70 border-emerald-100"
          : isFailed
          ? "bg-amber-50/70 border-amber-100"
          : "bg-gradient-to-r from-brand-cream/80 via-white to-brand-cream/50 border-brand-border/60"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm",
              isProcessed
                ? "bg-emerald-600 text-white"
                : isFailed
                ? "bg-amber-600 text-white"
                : "bg-brand-dark text-brand-gold"
            )}>
              {isProcessed ? (
                <ShieldCheck className="h-6 w-6" />
              ) : isFailed ? (
                <AlertCircle className="h-6 w-6" />
              ) : (
                <RotateCcw className="h-6 w-6 stroke-[2.2]" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-heading text-lg font-semibold text-brand-dark">
                  {isProcessed
                    ? "Refund Completed"
                    : isFailed
                    ? "Refund Action Required"
                    : "100% Refund Initiated"}
                </h3>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                  isProcessed
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : isFailed
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-brand-gold/20 text-brand-dark border-brand-gold/40"
                )}>
                  {isProcessed
                    ? "Settled to Bank"
                    : isFailed
                    ? "Under Review"
                    : "Processing with Gateway"}
                </span>
              </div>
              <p className="text-xs text-brand-muted">
                {isProcessed
                  ? "Amount credited back to your original payment source account."
                  : "Your cancellation triggered an immediate automated refund reversal."}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
              Refund Amount
            </p>
            <p className="font-heading text-2xl font-bold text-brand-dark">
              ₹{displayAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Body: 3-Step Refund Visual Tracker */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-4">
            Refund Progress
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
            <div className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl border",
              isInitiated || isProcessed
                ? "bg-emerald-50/60 border-emerald-200"
                : isFailed
                ? "bg-amber-50/60 border-amber-200"
                : "bg-brand-light/10 border-brand-border/60"
            )}>
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                isInitiated || isProcessed
                  ? "bg-emerald-600 text-white"
                  : isFailed
                  ? "bg-amber-600 text-white"
                  : "bg-brand-muted text-white"
              )}>
                {isInitiated || isProcessed ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-brand-dark">Refund Initiated</p>
                <p className="text-[11px] text-brand-muted">
                  Reversal lodged with Razorpay
                </p>
              </div>
            </div>

            {/* Step 3: Bank Statement Credit */}
            <div className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl border",
              isProcessed
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-brand-cream/40 border-brand-border/70"
            )}>
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                isProcessed
                  ? "bg-emerald-600 text-white"
                  : "border-2 border-brand-gold bg-brand-gold/10 text-brand-accent"
              )}>
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
        </div>

        {/* Breakdown Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-brand-border/60 text-xs">
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

        {/* Security & Support Guarantee Footer */}
        <div className="rounded-xl bg-brand-light/20 p-4 border border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-brand-dark flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              100% Full Refund Guarantee
            </p>
            <p className="text-[11px] text-brand-muted leading-relaxed max-w-xl">
              Because your order was cancelled before shipping, no cancellation fee or restocking charge was deducted.
              Funds are credited to the exact account or UPI handle used during checkout.
            </p>
          </div>

          <a
            href={whatsappUrl}
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
