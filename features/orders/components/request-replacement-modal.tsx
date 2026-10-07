"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  Package,
  CheckCircle2,
  AlertCircle,
  Video,
  Tag,
  MessageCircle,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { CustomerOrderItem } from "../types";

export interface RequestReplacementModalProps {
  orderNumber: string;
  items: CustomerOrderItem[];
  whatsappUrl: string;
  contactEmail: string;
  returnWindowDays?: number;
}

const EXCHANGE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Custom"];

const REASONS = [
  { id: "size_exchange", label: "Size Exchange (Need a different size)" },
  { id: "defective_piece", label: "Defective / Damaged Piece (Requires unboxing video)" },
  { id: "different_color", label: "Color / Variant Swap" },
  { id: "wrong_item", label: "Received Incorrect Item" },
  { id: "rare_refund_request", label: "Rare Refund Exception (Subject to Manager Review)" },
];

export function RequestReplacementModal({
  orderNumber,
  items,
  whatsappUrl,
  contactEmail,
  returnWindowDays = 7,
}: RequestReplacementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "");
  const [reasonId, setReasonId] = useState<string>("size_exchange");
  const [desiredSize, setDesiredSize] = useState<string>("M");
  const [customNote, setCustomNote] = useState<string>("");
  const [tagsIntact, setTagsIntact] = useState<boolean>(true);
  const [videoReady, setVideoReady] = useState<boolean>(true);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // Construct message for WhatsApp concierge
  const buildConciergeMessage = () => {
    const reasonLabel =
      REASONS.find((r) => r.id === reasonId)?.label || "Doorstep Replacement";
    let msg = `Hi Velaash Care,\n\nI would like to request a Doorstep Replacement / Size Exchange for Order #${orderNumber}.\n\n`;
    if (selectedItem) {
      msg += `• Product: ${selectedItem.title}\n`;
      msg += `• Current Size: ${selectedItem.size} | Color: ${selectedItem.color}\n`;
    }
    msg += `• Request Type: ${reasonLabel}\n`;
    if (reasonId === "size_exchange") {
      msg += `• Desired Replacement Size: ${desiredSize}\n`;
    }
    if (customNote.trim()) {
      msg += `• Note / Details: ${customNote.trim()}\n`;
    }
    msg += `• Original Brand Tags Intact: ${tagsIntact ? "Yes" : "No"}\n`;
    msg += `• Unboxing Video Available: ${videoReady ? "Yes (ready to send)" : "No"}\n\n`;
    msg += `Please guide me with the reverse-pickup schedule and replacement dispatch.`;
    return encodeURIComponent(msg);
  };

  const dynamicWhatsappUrl = () => {
    const textParam = buildConciergeMessage();
    if (whatsappUrl.includes("?")) {
      return `${whatsappUrl.split("?")[0]}?text=${textParam}`;
    }
    return `${whatsappUrl}?text=${textParam}`;
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        leftIcon={<ArrowLeftRight className="h-3.5 w-3.5 text-brand-accent" />}
        className="text-xs"
      >
        Request Replacement / Size Exchange
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-2xl bg-white p-6 shadow-2xl border border-brand-border/80 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-brand-border/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 text-brand-dark">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-brand-dark">
                    Doorstep Replacement &amp; Exchange
                  </h3>
                </div>
                <p className="text-xs text-brand-muted">
                  Order #{orderNumber} • {returnWindowDays}-Day Hassle-Free Window
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-brand-muted hover:text-brand-dark hover:bg-brand-light/30 transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1: Select Item */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted block">
                1. Select Item to Replace or Exchange
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedItemId === item.id
                        ? "border-brand-gold bg-brand-cream/50 ring-1 ring-brand-gold/30"
                        : "border-brand-border/60 hover:bg-brand-cream/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="replacement-item"
                      value={item.id}
                      checked={selectedItemId === item.id}
                      onChange={() => setSelectedItemId(item.id)}
                      className="accent-brand-dark"
                    />
                    <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-brand-cream border border-brand-border/40">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-brand-subtle">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-dark truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-brand-muted">
                        Size: <strong>{item.size}</strong> • Color: <strong>{item.color}</strong>
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Reason */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted block">
                2. Reason for Replacement
              </label>
              <select
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
                className="w-full rounded-xl border border-brand-border/80 bg-white p-2.5 text-xs text-brand-dark focus:border-brand-gold focus:outline-none"
              >
                {REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desired Size Selector (if size exchange) */}
            {reasonId === "size_exchange" && (
              <div className="space-y-2 rounded-xl bg-brand-cream/40 p-3.5 border border-brand-border/60">
                <label className="text-xs font-bold text-brand-dark block">
                  Select Desired Replacement Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXCHANGE_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setDesiredSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        desiredSize === sz
                          ? "bg-brand-dark text-white border-brand-dark shadow-xs"
                          : "bg-white text-brand-dark border-brand-border/70 hover:border-brand-gold"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-brand-muted">
                  Our team will verify warehouse stock and dispatch the {desiredSize} size upon pickup.
                </p>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted block">
                Additional Details (Optional)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Describe fit preference, defect location, or special instructions..."
                rows={2}
                className="w-full rounded-xl border border-brand-border/80 p-2.5 text-xs text-brand-dark focus:border-brand-gold focus:outline-none resize-none"
              />
            </div>

            {/* Step 3: Verification Checklist */}
            <div className="space-y-2.5 rounded-xl bg-brand-light/20 p-3.5 border border-brand-border/60 text-xs">
              <p className="font-bold text-brand-dark flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Condition &amp; Policy Checklist
              </p>
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-brand-dark">
                <input
                  type="checkbox"
                  checked={tagsIntact}
                  onChange={(e) => setTagsIntact(e.target.checked)}
                  className="accent-brand-dark mt-0.5"
                />
                <span>Original brand tags and protective polybag are intact and undamaged.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-brand-dark">
                <input
                  type="checkbox"
                  checked={videoReady}
                  onChange={(e) => setVideoReady(e.target.checked)}
                  className="accent-brand-dark mt-0.5"
                />
                <span>Mandatory continuous unboxing video is ready to share for swift approval.</span>
              </label>
            </div>

            {/* Rare Refund Clause Note */}
            <div className="rounded-xl bg-brand-cream/60 p-3 border border-brand-gold/40 text-[11px] text-brand-muted leading-relaxed">
              <strong>Store Policy Notice:</strong> In line with our standard terms, doorstep replacements and size exchanges are our primary remedy. Cash refunds are strictly rare exceptions processed only when an identical piece is out of stock or by special managerial approval.
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-brand-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="w-full sm:w-auto text-xs"
              >
                Close
              </Button>

              <a
                href={dynamicWhatsappUrl()}
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
                  Submit via WhatsApp Concierge
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
