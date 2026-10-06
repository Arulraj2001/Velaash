"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { XCircle, AlertTriangle, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { cancelCustomerOrderAction } from "../actions/cancel-order-action";

interface CancelOrderButtonProps {
  orderNumber: string;
  className?: string;
  totalAmount?: number;
  paymentMethod?: "cod" | "razorpay";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
}

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Want to change size or color",
  "Need to modify delivery address",
  "Decided on a different outfit",
  "Expected faster delivery",
  "Other reason",
];

export function CancelOrderButton({
  orderNumber,
  className,
  totalAmount,
  paymentMethod,
  paymentStatus,
}: CancelOrderButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPrepaid = paymentMethod === "razorpay" && paymentStatus === "paid";
  const isCod = paymentMethod === "cod";

  const handleOpen = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
    }
  };

  const handleConfirmCancel = () => {
    setErrorMsg(null);
    const finalReason =
      selectedReason === "Other reason" && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    startTransition(async () => {
      const res = await cancelCustomerOrderAction(orderNumber, finalReason);
      if (res.success) {
        setSuccessMsg(
          res.message ||
            (isPrepaid
              ? "Order cancelled. Full refund has been initiated to your original payment method."
              : "Order cancelled successfully.")
        );
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Failed to cancel order. Please try again.");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={className}
        leftIcon={<XCircle className="h-4 w-4 text-rose-600" />}
      >
        Cancel Order
      </Button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-brand-border/80 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold text-brand-dark">
                  Cancel Order #{orderNumber}?
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Are you sure you want to cancel this order? This action cannot be undone and your items will be returned to inventory.
                </p>
              </div>
            </div>

            {/* Refund Assurance Banner */}
            {isPrepaid && typeof totalAmount === "number" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% Full Refund Guarantee</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  You have paid <strong>₹{totalAmount.toLocaleString("en-IN")}</strong> online. A full refund will be automatically initiated to your original payment method (UPI / Card / NetBanking) and typically reflects in your bank account within <strong>5–7 business days</strong>.
                </p>
              </div>
            )}

            {isCod && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700 leading-relaxed">
                <strong>Cash on Delivery (COD):</strong> No payment was collected for this order. No refund is required.
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {errorMsg}
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-2">
              <label htmlFor="cancel-reason-select" className="text-xs font-semibold text-brand-dark">
                Please let us know why you are cancelling:
              </label>
              <select
                id="cancel-reason-select"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-xs text-brand-dark focus:border-brand-accent focus:outline-none"
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {selectedReason === "Other reason" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us more (optional)..."
                  rows={2}
                  disabled={isPending}
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-xs text-brand-dark focus:border-brand-accent focus:outline-none"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
              >
                Keep Order
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isPending}
                leftIcon={
                  isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )
                }
              >
                {isPending ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
