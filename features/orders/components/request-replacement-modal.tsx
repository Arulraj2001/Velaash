"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Package,
  CheckCircle2,
  AlertCircle,
  Video,
  ShieldCheck,
  X,
  Phone,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { CustomerOrderItem } from "../types";
import { createReplacementRequestAction } from "../actions/replacement-actions";

export interface RequestReplacementModalProps {
  orderNumber: string;
  items: CustomerOrderItem[];
  whatsappUrl: string;
  contactEmail: string;
  returnWindowDays?: number;
  shippingPhone?: string;
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
  shippingPhone = "",
}: RequestReplacementModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "");
  const [reasonId, setReasonId] = useState<string>("size_exchange");
  const [desiredSize, setDesiredSize] = useState<string>("M");
  const [customerPhone, setCustomerPhone] = useState<string>(shippingPhone);
  const [customNote, setCustomNote] = useState<string>("");
  const [tagsIntact, setTagsIntact] = useState<boolean>(true);
  const [videoReady, setVideoReady] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleOpen = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (successMsg) {
      router.refresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit WhatsApp phone number so our team can reach you.");
      return;
    }

    if (!videoReady) {
      setErrorMsg("Continuous uncut unboxing video is required by store policy to process a replacement.");
      return;
    }

    startTransition(async () => {
      const res = await createReplacementRequestAction({
        orderNumber,
        orderItemId: selectedItemId,
        reason: reasonId,
        desiredSize: reasonId === "size_exchange" ? desiredSize : undefined,
        customerPhone: cleanPhone,
        customerNotes: customNote.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(
          "Replacement request recorded! Our store owner will contact you on WhatsApp (+91 " +
            cleanPhone +
            ") shortly to verify your uncut unboxing video."
        );
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to submit request. Please try again.");
      }
    });
  };

  // Pre-fill message for immediate WhatsApp conversation
  const buildConciergeMessage = () => {
    const reasonLabel = REASONS.find((r) => r.id === reasonId)?.label || "Doorstep Replacement";
    let msg = `Hi Velaash Care,\n\nI have submitted a replacement request for Order #${orderNumber}.\n\n`;
    if (selectedItem) {
      msg += `• Item: ${selectedItem.title}\n`;
      msg += `• Current Size: ${selectedItem.size} | Color: ${selectedItem.color}\n`;
    }
    msg += `• Reason: ${reasonLabel}\n`;
    if (reasonId === "size_exchange") {
      msg += `• Desired Size: ${desiredSize}\n`;
    }
    msg += `• Contact Phone: +91 ${customerPhone.replace(/\D/g, "")}\n`;
    msg += `• Unboxing Video: Ready on my phone.\n\n`;
    msg += `Please guide me with the verification and reverse-pickup schedule.`;
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

            {/* Success State View */}
            {successMsg ? (
              <div className="space-y-5 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-heading text-lg font-semibold text-brand-dark">
                    Request Received Successfully!
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed max-w-md mx-auto">
                    {successMsg}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 text-left space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5 text-amber-950">
                    <Video className="h-4 w-4 text-amber-700" />
                    Next Step: Uncut Unboxing Video Proof
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Keep your continuous uncut video ready on WhatsApp. You can also send it to our store owner right away using the button below.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                  <a
                    href={dynamicWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial"
                  >
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-full text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                      leftIcon={<MessageCircle className="h-4 w-4" />}
                    >
                      Chat with Owner on WhatsApp Now
                    </Button>
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    className="text-xs"
                  >
                    Close &amp; View Status
                  </Button>
                </div>
              </div>
            ) : (
              /* Request Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

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

                {/* WhatsApp Phone Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted block">
                    WhatsApp Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted text-xs font-mono">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      value={customerPhone.replace(/^(\+91|91)/, "")}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-brand-border/80 pl-11 pr-3 py-2.5 text-xs text-brand-dark focus:border-brand-gold focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Our store owner will call or WhatsApp this number to review the unboxing video proof.
                  </p>
                </div>

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
                      required
                      checked={videoReady}
                      onChange={(e) => setVideoReady(e.target.checked)}
                      className="accent-brand-dark mt-0.5"
                    />
                    <span>
                      Mandatory continuous unboxing video is ready on my phone to share with the owner.
                    </span>
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
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isPending || !videoReady}
                    className="w-full sm:w-auto text-xs"
                    leftIcon={
                      isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4" />
                      )
                    }
                  >
                    {isPending ? "Submitting Request..." : "Submit Replacement Request"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
