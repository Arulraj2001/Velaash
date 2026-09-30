"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminRole } from "@/types/database.types";
import type {
  AdminOrderDetail,
  OrderStatus,
} from "../types/orders";
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
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Download,
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
} from "lucide-react";

interface AdminOrderDetailViewProps {
  order: AdminOrderDetail;
  role: AdminRole;
}

export function AdminOrderDetailView({
  order: initialOrder,
  role,
}: AdminOrderDetailViewProps) {
  const isOwner = role === "owner";
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

  // Transitions available for current status
  const allowedNextTransitions = VALID_ORDER_STATUS_TRANSITIONS[order.status] || [];

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
        setOrder((prev) => ({
          ...prev,
          status: nextStatus,
          canCancel: ["pending", "confirmed", "packed"].includes(nextStatus),
          canRefund: ["cancelled", "returned"].includes(nextStatus) && prev.paymentStatus !== "refunded",
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
          canRefund: prev.paymentStatus !== "refunded",
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
          {/* Download Invoice Button */}
          <a
            href={`/api/admin/orders/${order.orderNumber}/invoice`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Download Invoice
          </a>

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

          {/* Push to Shiprocket — only for packed orders */}
          {order.status === "packed" && (
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
              Mark as Refunded
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
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
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

            {order.status === "shipped" && order.trackingNumber && (
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                AWB: {order.trackingNumber} ({order.courierName})
              </span>
            )}
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
                            {new Date(h.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700">
                <Truck className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Mark Order as Shipped</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter courier and tracking details. This information will be displayed to the customer on their account order tracking page.
            </p>

            {shipError && (
              <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                {shipError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Courier / Delivery Partner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart, DTDC, India Post"
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  AWB / Tracking Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DEL123456789"
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Dispatch Note (Optional)
                </label>
                <input
                  type="text"
                  value={shipNote}
                  onChange={(e) => setShipNote(e.target.value)}
                  placeholder="e.g. Dispatched from primary hub"
                  className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmShipment}
                className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 shadow-2xs"
              >
                {isPending ? "Confirming..." : "Confirm Shipment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Cancel Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling this order will release all reserved inventory items back into available product variant stock.
            </p>

            {cancelError && (
              <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                {cancelError}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="block font-medium text-slate-700">
                Cancellation Reason Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation due to wrong size selected"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmCancel}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 shadow-2xs"
              >
                {isPending ? "Cancelling..." : "Confirm Cancellation & Restore Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER ONLY: MARK AS REFUNDED MODAL */}
      {showRefundModal && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <RotateCcw className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Record Manual Refund (Owner Only)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {/* Crucial Explanatory Notice */}
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="h-4 w-4 text-amber-700" />
                Important Notice regarding Razorpay Refunds
              </div>
              <p className="leading-relaxed text-[11px]">
                This action does <strong>NOT</strong> automatically initiate a financial refund via Razorpay. You must first issue the refund through your official <strong>Razorpay Merchant Dashboard</strong>. This button simply updates payment status to &lsquo;refunded&rsquo; and logs the audit trail on our platform.
              </p>
            </div>

            {refundError && (
              <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                {refundError}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="block font-medium text-slate-700">
                Refund Reference / Audit Note (Optional)
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Razorpay Refund ID: rfnd_xyz or manual NEFT confirmation"
                className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmRefund}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-2xs"
              >
                {isPending ? "Recording..." : "Confirm & Record Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
