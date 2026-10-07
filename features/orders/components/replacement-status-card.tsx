"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowLeftRight,
  Video,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Tag,
  CreditCard,
  XCircle,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { OrderReplacementRecord, CustomerOrderItem } from "../types";

export interface ReplacementStatusCardProps {
  replacement: OrderReplacementRecord;
  items?: CustomerOrderItem[];
  whatsappUrl?: string;
  orderNumber: string;
}

export function ReplacementStatusCard({
  replacement,
  items = [],
  whatsappUrl = "/contact",
  orderNumber,
}: ReplacementStatusCardProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  // Find associated item if available for display
  const matchedItem = items.find((i) => i.id === replacement.orderItemId);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusBadge = () => {
    switch (replacement.status) {
      case "pending_video_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Unboxing Video Review Pending
          </span>
        );
      case "video_verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Video Proof Verified
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-300">
            <Truck className="h-3.5 w-3.5 text-purple-600" />
            Replacement Approved &amp; Dispatched
          </span>
        );
      case "store_credit_issued":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-300">
            <Tag className="h-3.5 w-3.5 text-indigo-600" />
            Store Credit Voucher Issued
          </span>
        );
      case "refund_approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-300">
            <CreditCard className="h-3.5 w-3.5 text-purple-600" />
            Rare Refund Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            Request Declined
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Replacement Fulfilled
          </span>
        );
      default:
        return null;
    }
  };

  // WhatsApp concierge direct link with replacement reference
  const directWhatsappText = encodeURIComponent(
    `Hi Velaash Care,\n\nI have requested a replacement for Order #${orderNumber} (${replacement.itemTitle}).\nMy contact phone is +91 ${replacement.customerPhone}.\nI am ready with my unboxing video proof.`
  );
  const directWhatsappUrl = whatsappUrl.includes("?")
    ? `${whatsappUrl.split("?")[0]}?text=${directWhatsappText}`
    : `${whatsappUrl}?text=${directWhatsappText}`;

  return (
    <div className="rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm space-y-5 overflow-hidden relative">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 text-brand-dark">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-brand-dark">
              Doorstep Replacement &amp; Exchange Status
            </h3>
          </div>
          <p className="text-xs text-brand-muted">
            Request ID: <span className="font-mono font-medium">{replacement.id.slice(0, 8)}</span> • Order #{orderNumber}
          </p>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Item Summary Card */}
      <div className="flex items-center gap-4 p-3.5 rounded-xl bg-brand-cream/30 border border-brand-border/60">
        <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-brand-cream border border-brand-border/40">
          {matchedItem?.imageUrl ? (
            <Image
              src={matchedItem.imageUrl}
              alt={replacement.itemTitle}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-brand-subtle">
              <Package className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <h4 className="text-xs font-semibold text-brand-dark truncate">
            {replacement.itemTitle}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-brand-muted flex-wrap">
            <span>
              Current: <strong>{replacement.currentSize || "Free Size"}</strong>
            </span>
            {replacement.desiredSize && (
              <>
                <span>→</span>
                <span className="text-brand-dark font-semibold">
                  Desired Size: <strong>{replacement.desiredSize}</strong>
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-brand-muted">
            Reason: <span className="capitalize">{replacement.reason.replace(/_/g, " ")}</span>
          </p>
        </div>
      </div>

      {/* Status-Specific Details Body */}
      {replacement.status === "pending_video_review" && (
        <div className="space-y-4 rounded-xl bg-amber-50/60 p-4 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <div className="flex items-start gap-3">
            <Video className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-950 text-sm">
                Unboxing Video Verification in Progress
              </p>
              <p>
                Our store owner will WhatsApp or call you at{" "}
                <strong className="font-mono text-amber-950">+91 {replacement.customerPhone}</strong>{" "}
                shortly to review your mandatory continuous unboxing video proof.
              </p>

              <div className="rounded-lg bg-white/80 p-3 border border-amber-200 text-[11px] text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  What to have ready on WhatsApp:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Continuous, uncut video showing the sealed package before opening.</li>
                  <li>Clear view of the shipping label and the specific issue or garment tags.</li>
                  <li>Original brand tags and polybag intact.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-amber-200/60">
            <span className="text-[11px] text-amber-800">
              Want to speed up approval? Message our owner directly on WhatsApp:
            </span>
            <a
              href={directWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                leftIcon={<MessageCircle className="h-3.5 w-3.5" />}
              >
                Send Video on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      )}

      {replacement.status === "video_verified" && (
        <div className="space-y-3 rounded-xl bg-emerald-50/70 p-4 border border-emerald-200 text-xs text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Unboxing Video Verified by Store Owner
              </p>
              <p className="text-emerald-900 leading-relaxed">
                Thank you! Your video proof has been reviewed and approved. Our warehouse team is now preparing your replacement {replacement.desiredSize ? `(Size: ${replacement.desiredSize})` : ""} for reverse-pickup and dispatch.
              </p>
            </div>
          </div>
        </div>
      )}

      {replacement.status === "approved" && (
        <div className="space-y-3 rounded-xl bg-purple-50/70 p-4 border border-purple-200 text-xs text-purple-950">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Replacement Approved &amp; Scheduled
              </p>
              <p className="text-purple-900 leading-relaxed">
                Your replacement package is confirmed! Our courier partner will collect the returned item and deliver your replacement at your doorstep.
              </p>

              {(replacement.replacementCourier || replacement.replacementTrackingNumber) && (
                <div className="mt-2 p-3 rounded-lg bg-white/90 border border-purple-200 text-xs space-y-1">
                  <p className="text-[11px] text-purple-800 font-medium uppercase tracking-wider">
                    Replacement Courier Details
                  </p>
                  <p className="text-slate-900 font-semibold">
                    Partner: {replacement.replacementCourier || "Standard Surface Express"}
                  </p>
                  {replacement.replacementTrackingNumber && (
                    <p className="text-slate-800 font-mono text-[11px]">
                      AWB / Tracking Number: <strong>{replacement.replacementTrackingNumber}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {replacement.status === "store_credit_issued" && (
        <div className="space-y-3 rounded-xl bg-indigo-50/80 p-4 border border-indigo-200 text-xs text-indigo-950">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <p className="font-semibold text-sm">
                  Store Credit Voucher Issued
                </p>
                <p className="text-indigo-900 leading-relaxed">
                  As the requested size or piece was out of stock, a store shopping voucher has been issued for your order value of{" "}
                  <strong>₹{replacement.storeCreditAmount?.toLocaleString("en-IN") || "—"}</strong>.
                </p>
              </div>

              {replacement.storeCreditCode && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-indigo-200 shadow-2xs max-w-md">
                  <span className="text-[11px] uppercase tracking-wider text-indigo-700 font-bold">
                    Voucher Code:
                  </span>
                  <span className="font-mono font-bold text-sm text-brand-dark flex-1 select-all">
                    {replacement.storeCreditCode}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCode(replacement.storeCreditCode!)}
                    className="h-8 text-xs px-2.5"
                    leftIcon={copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  >
                    {copiedCode ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
              <p className="text-[11px] text-indigo-800">
                You can apply this code on the checkout page on any new order within 12 months.
              </p>
            </div>
          </div>
        </div>
      )}

      {replacement.status === "refund_approved" && (
        <div className="space-y-2 rounded-xl bg-purple-50/80 p-4 border border-purple-200 text-xs text-purple-950">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Rare Refund Exception Approved
              </p>
              <p className="text-purple-900 leading-relaxed">
                The store manager has approved your rare refund exception. The refund will be credited back to your original source of payment within standard banking cycles (5–7 business days).
              </p>
            </div>
          </div>
        </div>
      )}

      {replacement.status === "rejected" && (
        <div className="space-y-2 rounded-xl bg-rose-50/80 p-4 border border-rose-200 text-xs text-rose-950">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Replacement Request Could Not Be Approved
              </p>
              <p className="text-rose-900 leading-relaxed">
                Reason: <strong>{replacement.rejectionReason || "Conditions of return policy not met."}</strong>
              </p>
              <p className="text-[11px] text-rose-800 pt-1">
                If you believe this was in error, please reach out directly to Velaash customer support on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {replacement.status === "completed" && (
        <div className="space-y-2 rounded-xl bg-emerald-50/80 p-4 border border-emerald-200 text-xs text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                Replacement Successfully Completed
              </p>
              <p className="text-emerald-900 leading-relaxed">
                This exchange has been completed and delivered to your satisfaction. Thank you for choosing Velaash!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
