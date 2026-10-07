"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminRole } from "@/types/database.types";
import type {
  AdminOrderDetail,
  OrderStatus,
} from "../types/orders";
import type { LogisticsMode } from "@/features/settings/types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  VALID_ORDER_STATUS_TRANSITIONS,
} from "../types/orders";
import {
  updateOrderStatusAction,
  updateOrderAdminNotesAction,
  markOrderAsRefundedAction,
  cancelAdminOrderAction,
  resendOrderConfirmationEmailAction,
  pushToShiprocketAction,
} from "../actions/order-actions";
import { updateReplacementStatusAction } from "@/features/orders/actions/replacement-actions";
import { formatCurrency, formatDateTimeIST } from "@/lib/utils";
import { AdminModal } from "./admin-modal";
import {
  ArrowLeft,
  Package,
  Download,
  Printer,
  Mail,
  Truck,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MapPin,
  Calendar,
  Save,
  ShieldAlert,
  Info,
  Tag,
  ArrowLeftRight,

  Video,
  Phone,
  MessageCircle,
  ExternalLink,
} from "lucide-react";


interface AdminOrderDetailViewProps {
  order: AdminOrderDetail;
  role: AdminRole;
  logisticsMode: LogisticsMode;
}

export function AdminOrderDetailView({
  order: initialOrder,
  role,
  logisticsMode,
}: AdminOrderDetailViewProps) {
  const isOwner = role === "owner";
  const isShiprocketMode = logisticsMode === "shiprocket";
  const [order, setOrder] = useState<AdminOrderDetail>(initialOrder);
  const [isPending, startTransition] = useTransition();

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Mark Shipped Modal State
  const [showShipModal, setShowShipModal] = useState(false);
  const [courierName, setCourierName] = useState(order.courierName || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [shipNote, setShipNote] = useState("");
  const [shipError, setShipError] = useState("");

  // Cancel Order Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Refund Modal State (Owner Only)
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState("");

  // Admin Notes State
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "");
  const [notesSaved, setNotesSaved] = useState(false);

  // Shiprocket push state
  const [shiprocketPushing, setShiprocketPushing] = useState(false);

  // Replacement Desk State
  const [activeReplacement, setActiveReplacement] = useState(order.replacement);
  const [showRepApproveModal, setShowRepApproveModal] = useState(false);
  const [showRepCreditModal, setShowRepCreditModal] = useState(false);
  const [showRepDeclineModal, setShowRepDeclineModal] = useState(false);
  const [repCourier, setRepCourier] = useState(order.courierName || "");
  const [repTracking, setRepTracking] = useState(order.trackingNumber || "");
  const [repCreditAmount, setRepCreditAmount] = useState(order.totalAmount.toString());
  const [repCreditCode, setRepCreditCode] = useState("");
  const [repDeclineReason, setRepDeclineReason] = useState("");
  const [repAdminNotes, setRepAdminNotes] = useState("");
  const [repActionError, setRepActionError] = useState("");


  // Transitions available for current status
  const allowedNextTransitions = (VALID_ORDER_STATUS_TRANSITIONS[order.status] || []).filter(
    (nextStatus) =>
      order.paymentMethod !== "razorpay" ||
      order.paymentStatus === "paid" ||
      !["confirmed", "packed", "shipped", "out_for_delivery", "delivered"].includes(nextStatus)
  );

  // Handle direct transition
  const handleTransition = (nextStatus: OrderStatus) => {
    if (nextStatus === "shipped") {
      setShowShipModal(true);
      return;
    }

    if (nextStatus === "cancelled") {
      setShowCancelModal(true);
      return;
    }

    if (nextStatus === "refunded") {
      setShowRefundModal(true);
      return;
    }

    startTransition(async () => {
      setNotification(null);
      const res = await updateOrderStatusAction(order.orderNumber, {
        status: nextStatus,
      });

      if (res.success) {
        setNotification({
          type: "success",
          message: `Order status moved to '${ORDER_STATUS_LABELS[nextStatus]}'.`,
        });
        const nextPaymentStatus =
          nextStatus === "delivered" && order.paymentMethod === "cod"
            ? "paid"
            : order.paymentStatus;

        setOrder((prev) => ({
          ...prev,
          status: nextStatus,
          paymentStatus: nextPaymentStatus,
          canCancel: ["pending", "confirmed", "packed"].includes(nextStatus),
          canRefund: ["cancelled", "delivered"].includes(nextStatus) && nextPaymentStatus !== "refunded",
        }));
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to update order status.",
        });
      }
    });
  };

  // Submit Mark as Shipped
  const handleConfirmShipment = () => {
    if (!courierName.trim()) {
      setShipError("Courier / Delivery partner name is required.");
      return;
    }
    if (!trackingNumber.trim() || trackingNumber.trim().length < 3) {
      setShipError("Valid tracking / AWB number is required (at least 3 characters).");
      return;
    }

    setShipError("");
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.orderNumber, {
        status: "shipped",
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        note: shipNote.trim() || undefined,
      });

      if (res.success) {
        setShowShipModal(false);
        setNotification({
          type: "success",
          message: `Order #${order.orderNumber} successfully marked as Shipped. Tracking details recorded.`,
        });
        setOrder((prev) => ({
          ...prev,
          status: "shipped",
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          canCancel: false,
        }));
      } else {
        setShipError(res.error || "Failed to mark as shipped.");
      }
    });
  };

  // Submit Cancellation
  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      setCancelError("A cancellation reason note is required.");
      return;
    }

    setCancelError("");
    startTransition(async () => {
      const res = await cancelAdminOrderAction(order.orderNumber, cancelReason.trim());
      if (res.success) {
        setShowCancelModal(false);
        setNotification({
          type: "success",
          message: `Order #${order.orderNumber} has been cancelled. Inventory has been returned to stock.`,
        });
        setOrder((prev) => ({
          ...prev,
          status: "cancelled",
          cancelReason: `Cancelled by admin: ${cancelReason.trim()}`,
          canCancel: false,
          canRefund: prev.paymentStatus === "paid",
        }));
      } else {
        setCancelError(res.error || "Failed to cancel order.");
      }
    });
  };

  // Submit Mark as Refunded (Owner Only)
  const handleConfirmRefund = () => {
    setRefundError("");
    startTransition(async () => {
      const res = await markOrderAsRefundedAction(order.orderNumber, refundReason.trim() || undefined);
      if (res.success) {
        setShowRefundModal(false);
        setNotification({
          type: "success",
          message: `Order #${order.orderNumber} payment marked as Refunded. Audit entry recorded.`,
        });
        setOrder((prev) => ({
          ...prev,
          status: "refunded",
          paymentStatus: "refunded",
          canRefund: false,
        }));
      } else {
        setRefundError(res.error || "Failed to record refund.");
      }
    });
  };

  // Submit Replacement Actions
  const handleMarkVideoVerified = () => {
    if (!activeReplacement) return;
    startTransition(async () => {
      const res = await updateReplacementStatusAction({
        replacementId: activeReplacement.id,
        orderNumber: order.orderNumber,
        status: "video_verified",
      });
      if (res.success) {
        setActiveReplacement((prev) =>
          prev ? { ...prev, status: "video_verified", videoReviewed: true } : null
        );
        setNotification({
          type: "success",
          message: "Unboxing video marked as verified on WhatsApp! Proceed with dispatch or voucher.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to update replacement status.",
        });
      }
    });
  };

  const handleConfirmRepApprove = () => {
    if (!activeReplacement) return;
    setRepActionError("");
    startTransition(async () => {
      const res = await updateReplacementStatusAction({
        replacementId: activeReplacement.id,
        orderNumber: order.orderNumber,
        status: "approved",
        replacementCourier: repCourier.trim() || undefined,
        replacementTrackingNumber: repTracking.trim() || undefined,
        adminNotes: repAdminNotes.trim() || undefined,
      });
      if (res.success) {
        setActiveReplacement((prev) =>
          prev
            ? {
                ...prev,
                status: "approved",
                replacementCourier: repCourier.trim() || null,
                replacementTrackingNumber: repTracking.trim() || null,
              }
            : null
        );
        setShowRepApproveModal(false);
        setNotification({
          type: "success",
          message: "Replacement approved and scheduled for reverse pickup/dispatch!",
        });
      } else {
        setRepActionError(res.error || "Failed to approve replacement.");
      }
    });
  };

  const handleConfirmRepCredit = () => {
    if (!activeReplacement) return;
    setRepActionError("");
    const amountNum = Number(repCreditAmount) || order.totalAmount;
    startTransition(async () => {
      const res = await updateReplacementStatusAction({
        replacementId: activeReplacement.id,
        orderNumber: order.orderNumber,
        status: "store_credit_issued",
        storeCreditAmount: amountNum,
        storeCreditCode: repCreditCode.trim() || undefined,
        adminNotes: repAdminNotes.trim() || undefined,
      });
      if (res.success) {
        setActiveReplacement((prev) =>
          prev
            ? {
                ...prev,
                status: "store_credit_issued",
                storeCreditCode: res.storeCreditCode || prev.storeCreditCode,
                storeCreditAmount: amountNum,
              }
            : null
        );
        setShowRepCreditModal(false);
        setNotification({
          type: "success",
          message: `Store credit voucher (${res.storeCreditCode}) issued successfully!`,
        });
      } else {
        setRepActionError(res.error || "Failed to issue store credit.");
      }
    });
  };

  const handleConfirmRepDecline = () => {
    if (!activeReplacement) return;
    if (!repDeclineReason.trim()) {
      setRepActionError("A decline reason is required for customer visibility.");
      return;
    }
    setRepActionError("");
    startTransition(async () => {
      const res = await updateReplacementStatusAction({
        replacementId: activeReplacement.id,
        orderNumber: order.orderNumber,
        status: "rejected",
        rejectionReason: repDeclineReason.trim(),
        adminNotes: repAdminNotes.trim() || undefined,
      });
      if (res.success) {
        setActiveReplacement((prev) =>
          prev
            ? {
                ...prev,
                status: "rejected",
                rejectionReason: repDeclineReason.trim(),
              }
            : null
        );
        setShowRepDeclineModal(false);
        setNotification({
          type: "success",
          message: "Replacement request marked as declined.",
        });
      } else {
        setRepActionError(res.error || "Failed to decline replacement.");
      }
    });
  };

  const handleCompleteReplacement = () => {
    if (!activeReplacement) return;
    startTransition(async () => {
      const res = await updateReplacementStatusAction({
        replacementId: activeReplacement.id,
        orderNumber: order.orderNumber,
        status: "completed",
      });
      if (res.success) {
        setActiveReplacement((prev) =>
          prev ? { ...prev, status: "completed" } : null
        );
        setNotification({
          type: "success",
          message: "Replacement marked as fulfilled and completed.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to mark replacement as completed.",
        });
      }
    });
  };

  // Save Internal Admin Notes
  const handleSaveNotes = () => {

    startTransition(async () => {
      const res = await updateOrderAdminNotesAction(order.orderNumber, adminNotes);
      if (res.success) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 3000);
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to save internal admin notes.",
        });
      }
    });
  };

  // Resend Confirmation Email
  const handleResendEmail = () => {
    startTransition(async () => {
      setNotification(null);
      const res = await resendOrderConfirmationEmailAction(order.orderNumber);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Confirmation email successfully resent to ${order.shippingAddress.email}.`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to resend confirmation email.",
        });
      }
    });
  };

  // Push to Shiprocket
  const handlePushToShiprocket = async () => {
    if (shiprocketPushing) return;
    setShiprocketPushing(true);
    setNotification(null);
    try {
      const res = await pushToShiprocketAction(order.orderNumber);
      if (res.success) {
        const awbMsg = res.awbCode ? ` AWB: ${res.awbCode}.` : "";
        setNotification({
          type: "success",
          message: `Order pushed to Shiprocket successfully.${awbMsg} Status updated to Shipped.`,
        });
        setOrder((prev) => ({
          ...prev,
          status: "shipped",
          trackingNumber: res.awbCode ?? prev.trackingNumber,
          canCancel: false,
        }));
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to push order to Shiprocket.",
        });
      }
    } finally {
      setShiprocketPushing(false);
    }
  };

  const statusStyle = ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending;
  const payStyle = PAYMENT_STATUS_STYLES[order.paymentStatus] || PAYMENT_STATUS_STYLES.pending;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all orders
        </Link>

        {/* Action Buttons: Invoice, Resend Email, Cancel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print / Save Invoice Link */}
          <Link
            href={`/admin/orders/${order.orderNumber}/invoice?autoPrint=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Print / Save Invoice
          </Link>

          {/* Resend Confirmation Email */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleResendEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Mail className="h-3.5 w-3.5 text-slate-500" />
            Resend Email
          </button>

          {/* Fulfillment Action for Packed Orders — mode-aware */}
          {order.status === "packed" && (
            isShiprocketMode ? (
              /* SHIPROCKET MODE: one-click API dispatch */
              <button
                type="button"
                disabled={isPending || shiprocketPushing}
                onClick={handlePushToShiprocket}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 transition-colors shadow-2xs"
              >
                {shiprocketPushing ? (
                  <svg className="h-3.5 w-3.5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Truck className="h-3.5 w-3.5 text-indigo-600" />
                )}
                {shiprocketPushing ? "Pushing..." : "Push to Shiprocket"}
              </button>
            ) : (
              /* MANUAL MODE: enter courier + tracking number yourself */
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleTransition("shipped")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors shadow-2xs"
              >
                <Truck className="h-3.5 w-3.5 text-emerald-600" />
                Mark as Shipped
              </button>
            )
          )}

          {/* Owner-Only: Mark as Refunded */}
          {isOwner && order.canRefund && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowRefundModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
              Issue Refund (Rare Exception)
            </button>
          )}

          {/* Cancel Order Action */}
          {order.canCancel && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Order Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
                #{order.orderNumber}
              </h1>
              {/* Fulfillment Badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              {/* Payment Badge */}
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${payStyle.bg} ${payStyle.text} ${payStyle.border}`}
              >
                {order.paymentStatus.toUpperCase()} ({order.paymentMethod === "cod" ? "COD" : "Prepaid"})
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Placed on {formatDateTimeIST(order.createdAt, {
                month: "long",
              })}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Total Order Value
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>

        {/* STATUS UPDATE CONTROLS: State Machine Stepper & Actions */}
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Fulfillment Flow Transition
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {order.shiprocketOrderId && (
                <a
                  href="https://app.shiprocket.in/orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                  title="Open Shiprocket Merchant Console"
                >
                  <Package className="h-3 w-3" />
                  Shiprocket #{order.shiprocketOrderId}
                </a>
              )}
              {order.trackingNumber && (
                <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  AWB: {order.trackingNumber} {order.courierName ? `(${order.courierName})` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500">Available Next Actions:</span>
            {allowedNextTransitions.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No further state transitions available from &apos;{ORDER_STATUS_LABELS[order.status]}&apos;.
              </span>
            ) : (
              allowedNextTransitions.map((nextStatus) => {
                const label = ORDER_STATUS_LABELS[nextStatus];
                const isDispatched = nextStatus === "shipped";
                const isCancelled = nextStatus === "cancelled";
                const isRefunded = nextStatus === "refunded";

                return (
                  <button
                    key={nextStatus}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleTransition(nextStatus)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs ${
                      isDispatched
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : isCancelled
                        ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        : isRefunded
                        ? "bg-slate-700 text-white hover:bg-slate-800"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Move to &ldquo;{label}&rdquo;
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DOORSTEP REPLACEMENT & WHATSAPP VIDEO DESK */}
      {activeReplacement && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                  Doorstep Replacement Desk
                  <span className="text-xs font-mono font-normal text-slate-500">
                    #{activeReplacement.id.slice(0, 8)}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Requested on {formatDateTimeIST(activeReplacement.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  activeReplacement.status === "video_verified"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : activeReplacement.status === "approved"
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : activeReplacement.status === "store_credit_issued"
                    ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                    : activeReplacement.status === "refund_approved"
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : activeReplacement.status === "rejected"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : activeReplacement.status === "completed"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {activeReplacement.status === "pending_video_review"
                  ? "Unboxing Video Verification Pending"
                  : activeReplacement.status === "video_verified"
                  ? "Video Proof Verified"
                  : activeReplacement.status === "approved"
                  ? "Replacement Approved & Scheduled"
                  : activeReplacement.status === "store_credit_issued"
                  ? "Store Credit Issued"
                  : activeReplacement.status === "refund_approved"
                  ? "Rare Refund Approved"
                  : activeReplacement.status === "rejected"
                  ? "Declined"
                  : "Completed"}
              </span>
            </div>
          </div>

          {/* Grid: Requested Item + WhatsApp Video Outreach */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Details */}
            <div className="rounded-xl bg-white p-4 border border-amber-200/70 space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Item &amp; Exchange Specification
              </span>
              <p className="font-semibold text-slate-900 text-sm">
                {activeReplacement.itemTitle}
              </p>
              <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                <span>Current: <strong>{activeReplacement.currentSize || "Free Size"}</strong></span>
                {activeReplacement.desiredSize && (
                  <>
                    <span>→</span>
                    <span className="text-purple-700 font-bold">
                      Requested Size: {activeReplacement.desiredSize}
                    </span>
                  </>
                )}
              </div>
              <p className="text-slate-600">
                Reason: <strong className="capitalize">{activeReplacement.reason.replace(/_/g, " ")}</strong>
              </p>
              {activeReplacement.customerNotes && (
                <div className="pt-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="font-semibold text-slate-700">Customer Note: </span>
                  &ldquo;{activeReplacement.customerNotes}&rdquo;
                </div>
              )}
            </div>

            {/* WhatsApp Outreach & Verification Box */}
            <div className="rounded-xl bg-white p-4 border border-amber-200/70 space-y-3 text-xs flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-amber-700" />
                  Owner Unboxing Video Verification
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Customer WhatsApp: <strong className="font-mono text-slate-900">+91 {activeReplacement.customerPhone}</strong>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Per store policy, unboxing video is received directly on WhatsApp. Click below to open chat with pre-filled video request.
                </p>
              </div>

              {/* 1-Click WhatsApp Button */}
              {(() => {
                const phoneDigits = (activeReplacement.customerPhone || order.shippingAddress.phone || "").replace(/\D/g, "");
                const customerName = order.shippingAddress.fullName || "Customer";
                const waText = encodeURIComponent(
                  `Hi ${customerName}, this is Velaash regarding your replacement request for Order #${order.orderNumber} (${activeReplacement.itemTitle}). Please share your continuous uncut unboxing video proof with us here so we can verify and process your exchange.`
                );
                const waUrl = phoneDigits ? `https://wa.me/91${phoneDigits.replace(/^91/, "")}?text=${waText}` : "#";

                return (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 text-xs transition-colors shadow-2xs w-full"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open WhatsApp to Request / Review Video
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                );
              })()}
            </div>
          </div>

          {/* Special Result Banners */}
          {activeReplacement.status === "store_credit_issued" && activeReplacement.storeCreditCode && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-bold">Store Credit Voucher: </span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 ml-1">
                  {activeReplacement.storeCreditCode}
                </span>
                <span className="ml-2 font-medium">
                  Amount: ₹{(activeReplacement.storeCreditAmount || order.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <span className="text-[11px] text-indigo-700">Valid for 12 months</span>
            </div>
          )}

          {activeReplacement.status === "approved" && (activeReplacement.replacementCourier || activeReplacement.replacementTrackingNumber) && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-bold">Dispatched via: </span>
                <span>{activeReplacement.replacementCourier || "Standard Surface Express"}</span>
                {activeReplacement.replacementTrackingNumber && (
                  <span className="font-mono font-medium ml-2 bg-white px-2 py-0.5 rounded border border-purple-200">
                    AWB: {activeReplacement.replacementTrackingNumber}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeReplacement.status === "rejected" && activeReplacement.rejectionReason && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
              <span className="font-bold">Declined Reason: </span>
              <span>{activeReplacement.rejectionReason}</span>
            </div>
          )}

          {/* Owner Action Buttons Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/80 flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Desk Decisions:
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {activeReplacement.status === "pending_video_review" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleMarkVideoVerified}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Video as Verified
                </button>
              )}

              {["pending_video_review", "video_verified"].includes(activeReplacement.status) && (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setRepActionError("");
                      setShowRepApproveModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Approve &amp; Dispatch
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setRepActionError("");
                      setRepCreditAmount(order.totalAmount.toString());
                      setShowRepCreditModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Issue Store Credit
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setShowRefundModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Rare Refund Exception
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setRepActionError("");
                      setShowRepDeclineModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Decline Request
                  </button>
                </>
              )}

              {activeReplacement.status === "approved" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCompleteReplacement}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Fulfilled &amp; Closed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Details Left & Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column: Order Items & Pricing Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Ordered Items ({order.items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5"
                >
                  <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs font-semibold text-slate-900 leading-snug">
                      {item.productName}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                      <span>Size: <strong className="text-slate-700">{item.size}</strong></span>
                      <span>•</span>
                      <span>Color: <strong className="text-slate-700">{item.color}</strong></span>
                    </div>
                    {item.sku && (
                      <p className="text-[11px] font-mono text-slate-400">
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900 font-mono">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping Charges</span>
                <span className="font-mono">
                  {order.shippingCharge === 0 ? "FREE" : formatCurrency(order.shippingCharge)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Audit Trail &amp; Status History
            </h2>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-1">
              {order.statusHistory.length === 0 ? (
                <p className="text-xs text-slate-400 pl-4 italic">
                  No previous audit records recorded.
                </p>
              ) : (
                order.statusHistory.map((h) => {
                  const sStyle = ORDER_STATUS_STYLES[h.status] || ORDER_STATUS_STYLES.pending;
                  return (
                    <div key={h.id} className="relative pl-5">
                      <div
                        className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 border-white ${sStyle.dot}`}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${sStyle.bg} ${sStyle.text} ${sStyle.border}`}
                          >
                            {ORDER_STATUS_LABELS[h.status] || h.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTimeIST(h.createdAt)}
                          </span>
                        </div>
                        {h.note && (
                          <p className="text-xs text-slate-600 pt-0.5 leading-relaxed">
                            {h.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Customer, Addresses, Notes */}
        <div className="space-y-6">
          {/* Customer & Shipping Address */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Customer &amp; Delivery Address
              </h2>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-slate-900">
                {order.shippingAddress.fullName || "Customer"}
              </p>
              <p className="text-slate-600">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-slate-600">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-slate-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                <span className="font-mono font-medium">{order.shippingAddress.pincode}</span>
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1 font-mono text-[11px] text-slate-500">
                <p>Phone: {order.shippingAddress.phone}</p>
                <p>Email: {order.shippingAddress.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Verification
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium text-slate-900">
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Prepaid (Razorpay)"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${payStyle.bg} ${payStyle.text} ${payStyle.border}`}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>

              {order.razorpayPaymentId && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">
                    Razorpay Payment ID
                  </span>
                  <p className="font-mono text-xs font-semibold text-slate-800 break-all select-all">
                    {order.razorpayPaymentId}
                  </p>
                </div>
              )}

              {(order.razorpayRefundId || order.refundStatus) && (
                <div className="pt-2 border-t border-slate-100 space-y-2 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-900 uppercase">
                      Resolution / Refund Status
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        order.refundStatus === "processed"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.refundStatus === "pending_review"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : order.refundStatus === "failed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {order.refundStatus === "pending_review"
                        ? "Review Queued (Replacements First)"
                        : order.refundStatus === "processed"
                        ? "Refund Processed"
                        : order.refundStatus === "failed"
                        ? "Refund Failed"
                        : order.refundStatus === "initiated"
                        ? "Refund Initiated"
                        : order.refundStatus || "Initiated"}
                    </span>
                  </div>

                  {order.refundAmount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Refund Amount:</span>
                      <span className="font-semibold text-slate-900">₹{order.refundAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {order.razorpayRefundId && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Refund ID:</span>
                      <p className="font-mono text-[11px] font-medium text-slate-800 break-all select-all">
                        {order.razorpayRefundId}
                      </p>
                    </div>
                  )}

                  {order.refundArn && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Bank ARN:</span>
                      <p className="font-mono text-[11px] text-slate-700">
                        {order.refundArn}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Order Notes (Read-Only) */}
          {order.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Customer Delivery Instructions
              </span>
              <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                &ldquo;{order.notes}&rdquo;
              </p>
            </div>
          )}

          {/* Internal Admin Notes (Staff & Owner) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Internal Admin Notes
                </span>
              </div>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                Private
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Notes visible only to admin users (e.g. &ldquo;called customer&rdquo;, &ldquo;gift wrap confirmed&rdquo;).
            </p>

            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter private internal note..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save Notes
              </button>
              {notesSaved && (
                <span className="text-xs font-medium text-emerald-600">
                  Notes saved!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MARK AS SHIPPED MODAL */}
      <AdminModal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        maxWidth="md"
        icon={<Truck className="h-5 w-5 text-purple-700" />}
        title="Mark Order as Shipped"
        description="Enter courier and tracking details for customer order tracking."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowShipModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmShipment}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {isPending ? "Confirming..." : "Confirm Shipment"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {shipError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              {shipError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Courier / Delivery Partner <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. Delhivery, Blue Dart, DTDC, India Post"
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              AWB / Tracking Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DEL123456789"
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dispatch Note (Optional)
            </label>
            <input
              type="text"
              value={shipNote}
              onChange={(e) => setShipNote(e.target.value)}
              placeholder="e.g. Dispatched from primary hub"
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      </AdminModal>

      {/* CANCEL ORDER MODAL */}
      <AdminModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        maxWidth="md"
        icon={<XCircle className="h-5 w-5 text-rose-700" />}
        title="Cancel Order"
        description="Release reserved inventory items back into available variant stock."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Go Back
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmCancel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {isPending ? "Cancelling..." : "Confirm & Restore Stock"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {cancelError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              {cancelError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Cancellation Reason Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation due to wrong size selected"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-rose-500 focus:outline-none transition-all resize-none"
            />
          </div>
        </div>
      </AdminModal>

      {/* OWNER ONLY: RECORD REFUND EXCEPTION MODAL */}
      {isOwner && (
        <AdminModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          maxWidth="md"
          icon={<RotateCcw className="h-5 w-5 text-emerald-700" />}
          title="Record Refund Exception (Rare Case)"
          description="Owner Only: Updates payment status and internal audit trail for verified refund exceptions."
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmRefund}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
              >
                {isPending ? "Recording..." : "Confirm & Record Refund Exception"}
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            {/* Crucial Explanatory Notice */}
            <div className="rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Store Policy: Replacements First, Rare Cash Refunds</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Under standard store policy, customers receive doorstep replacements or store credit. Cash refunds are strictly rare exceptions (e.g. irreparable manufacturing defect or out-of-stock piece).
              </p>
              <p className="leading-relaxed text-[11px] pt-1 border-t border-amber-200/60 font-medium">
                Note: This button does <strong>NOT</strong> automatically initiate a financial refund via Razorpay. You must first issue the refund through your official <strong>Razorpay Merchant Dashboard</strong>. This logs the audit trail and marks payment status as &lsquo;refunded&rsquo;.
              </p>
            </div>

            {refundError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {refundError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                Refund Reference / Audit Note (Optional)
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Razorpay Refund ID: rfnd_xyz or manual NEFT confirmation"
                className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* REPLACEMENT: APPROVE & DISPATCH MODAL */}
      <AdminModal
        isOpen={showRepApproveModal}
        onClose={() => setShowRepApproveModal(false)}
        maxWidth="md"
        icon={<Truck className="h-5 w-5 text-purple-700" />}
        title="Approve Replacement &amp; Schedule Dispatch"
        description="Verify unboxing video proof and schedule reverse pickup or replacement dispatch."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowRepApproveModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmRepApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {isPending ? "Approving..." : "Confirm & Approve"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {repActionError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              {repActionError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Replacement Courier Partner (Optional)
            </label>
            <input
              type="text"
              value={repCourier}
              onChange={(e) => setRepCourier(e.target.value)}
              placeholder="e.g. Delhivery Surface, BlueDart, DTDC"
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tracking / AWB Number (Optional)
            </label>
            <input
              type="text"
              value={repTracking}
              onChange={(e) => setRepTracking(e.target.value)}
              placeholder="e.g. 1284719283"
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Internal Dispatch Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={repAdminNotes}
              onChange={(e) => setRepAdminNotes(e.target.value)}
              placeholder="e.g. Video proof verified on WhatsApp. Replacement piece packed from Shelf B."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none transition-all resize-none"
            />
          </div>
        </div>
      </AdminModal>

      {/* REPLACEMENT: ISSUE STORE CREDIT MODAL */}
      <AdminModal
        isOpen={showRepCreditModal}
        onClose={() => setShowRepCreditModal(false)}
        maxWidth="md"
        icon={<Tag className="h-5 w-5 text-indigo-700" />}
        title="Issue Store Credit Voucher"
        description="Creates a live, single-use coupon code in the system for the customer to use on their next purchase."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowRepCreditModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmRepCredit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {isPending ? "Generating..." : "Generate & Issue Credit"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {repActionError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              {repActionError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Credit Voucher Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              value={repCreditAmount}
              onChange={(e) => setRepCreditAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none transition-all font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Defaults to full order value. Customer can apply this coupon code at checkout.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Custom Voucher Code (Optional)
            </label>
            <input
              type="text"
              value={repCreditCode}
              onChange={(e) => setRepCreditCode(e.target.value.toUpperCase())}
              placeholder="e.g. EXCHANGE-ORD-1234 (leave blank to auto-generate)"
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none transition-all font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={repAdminNotes}
              onChange={(e) => setRepAdminNotes(e.target.value)}
              placeholder="e.g. Size out of stock, customer agreed to store shopping credit."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none transition-all resize-none"
            />
          </div>
        </div>
      </AdminModal>

      {/* REPLACEMENT: DECLINE REQUEST MODAL */}
      <AdminModal
        isOpen={showRepDeclineModal}
        onClose={() => setShowRepDeclineModal(false)}
        maxWidth="md"
        icon={<XCircle className="h-5 w-5 text-rose-700" />}
        title="Decline Replacement Request"
        description="Provide a clear, polite explanation that will be displayed to the customer on their order tracking page."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowRepDeclineModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmRepDecline}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {isPending ? "Declining..." : "Confirm Decline"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {repActionError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              {repActionError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Reason for Declining <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={repDeclineReason}
              onChange={(e) => setRepDeclineReason(e.target.value)}
              placeholder="e.g. Continuous unboxing video was not provided within the policy window, or original brand tags were removed."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none transition-all resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This note is visible to the customer on their order details page.
            </p>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

