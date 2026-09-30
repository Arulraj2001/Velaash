"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import type { AdminCoupon, CouponComputedStatus } from "../types/coupons";
import {
  COUPON_STATUS_LABELS,
  COUPON_STATUS_STYLES,
} from "../types/coupons";
import { toggleCouponStatusAction } from "../actions/coupon-actions";
import { CouponFormModal } from "./coupon-form-modal";
import { CouponDeleteModal } from "./coupon-delete-modal";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Copy,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface CouponsTableProps {
  initialCoupons: AdminCoupon[];
}

export function CouponsTable({ initialCoupons }: CouponsTableProps) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals state
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<AdminCoupon | null>(null);

  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filtered dataset
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Status filter
      if (statusFilter !== "all" && c.computedStatus !== statusFilter) {
        return false;
      }

      // Search query (code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!c.code.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [coupons, statusFilter, searchQuery]);

  // Status counts for filter pills
  const counts = useMemo(() => {
    return {
      all: coupons.length,
      active: coupons.filter((c) => c.computedStatus === "active").length,
      scheduled: coupons.filter((c) => c.computedStatus === "scheduled").length,
      expired: coupons.filter((c) => c.computedStatus === "expired").length,
      inactive: coupons.filter((c) => c.computedStatus === "inactive").length,
    };
  }, [coupons]);

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Quick Deactivate / Activate Toggle
  const handleToggleStatus = (coupon: AdminCoupon) => {
    const nextState = !coupon.isActive;
    startTransition(async () => {
      setNotification(null);
      const res = await toggleCouponStatusAction(coupon.id, nextState);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => {
            if (c.id === coupon.id) {
              const updatedStatus: CouponComputedStatus = nextState
                ? new Date() > new Date(c.validUntil)
                  ? "expired"
                  : new Date() < new Date(c.validFrom)
                  ? "scheduled"
                  : "active"
                : "inactive";

              return {
                ...c,
                isActive: nextState,
                computedStatus: updatedStatus,
              };
            }
            return c;
          })
        );
        setNotification({
          type: "success",
          message: `Coupon '${coupon.code}' has been ${nextState ? "activated" : "deactivated"}.`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to update coupon status.",
        });
      }
    });
  };

  // Handle Saved (Created or Updated)
  const handleSavedCoupon = (savedCoupon: AdminCoupon) => {
    setCoupons((prev) => {
      const exists = prev.some((c) => c.id === savedCoupon.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCoupon.id ? savedCoupon : c));
      }
      return [savedCoupon, ...prev];
    });
    setNotification({
      type: "success",
      message: `Coupon '${savedCoupon.code}' saved successfully.`,
    });
  };

  // Handle Deleted
  const handleDeletedCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    setNotification({
      type: "success",
      message: "Coupon has been deleted. Past orders remain unchanged.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Banner Notification */}
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

      {/* Top Filter Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-slate-900 text-white font-semibold shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Coupons ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active ({counts.active})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("scheduled")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "scheduled"
                ? "bg-blue-600 text-white font-semibold shadow-2xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Clock className="h-3 w-3" />
            Scheduled ({counts.scheduled})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("expired")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "expired"
                ? "bg-slate-700 text-white font-semibold shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Expired ({counts.expired})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "inactive"
                ? "bg-rose-600 text-white font-semibold shadow-2xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Inactive ({counts.inactive})
          </button>
        </div>

        {/* Create Coupon Button */}
        <button
          type="button"
          onClick={() => {
            setEditingCoupon(null);
            setIsDuplicate(false);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Coupon
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by coupon code (e.g. WELCOME)..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Showing:</span>
          <span className="font-semibold text-slate-800">
            {filteredCoupons.length} of {coupons.length} coupons
          </span>
          {(searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-rose-600 hover:underline ml-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Validity Window</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Active Toggle</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Layers className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No coupons found</p>
                      <p className="text-xs text-slate-400">
                        Try clearing your search or status filter, or create your first promo code.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = coupon.computedStatus === "expired";
                  const statusStyle =
                    COUPON_STATUS_STYLES[coupon.computedStatus] ||
                    COUPON_STATUS_STYLES.inactive;

                  return (
                    <tr
                      key={coupon.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isExpired ? "opacity-75 bg-slate-50/30" : ""
                      }`}
                    >
                      {/* Code Badge */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-800 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy Code"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {coupon.discountType === "percentage" ? (
                            <span className="font-semibold text-slate-900">
                              {coupon.discountValue}% OFF
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-900">
                              ₹{coupon.discountValue} FLAT
                            </span>
                          )}
                          {coupon.maxDiscountAmount && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              (Max ₹{coupon.maxDiscountAmount})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Min Order Value */}
                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {coupon.minOrderValue > 0
                          ? formatCurrency(coupon.minOrderValue)
                          : "None"}
                      </td>

                      {/* Usage Count & Limit (with Link to Orders) */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <Link
                              href={`/admin/orders?coupon_code=${coupon.code}`}
                              className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                              title="Click to view orders placed with this coupon"
                            >
                              {coupon.usageCount} used
                            </Link>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-500 font-mono">
                              {coupon.usageLimit ? `${coupon.usageLimit}` : "Unlimited"}
                            </span>
                          </div>
                          {coupon.ordersCount > 0 && (
                            <Link
                              href={`/admin/orders?coupon_code=${coupon.code}`}
                              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                            >
                              <span>{coupon.ordersCount} historical order{coupon.ordersCount === 1 ? "" : "s"}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Validity Window */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="space-y-0.5 text-[11px]">
                          <p>
                            From:{" "}
                            {new Date(coupon.validFrom).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p>
                            Until:{" "}
                            {new Date(coupon.validUntil).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Computed Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          {COUPON_STATUS_LABELS[coupon.computedStatus]}
                        </span>
                      </td>

                      {/* Quick Deactivate Switch */}
                      <td className="py-3 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isPending}
                            checked={coupon.isActive}
                            onChange={() => handleToggleStatus(coupon)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Orders Link */}
                          <Link
                            href={`/admin/orders?coupon_code=${coupon.code}`}
                            title="View Orders Using Coupon"
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setIsDuplicate(false);
                              setIsFormOpen(true);
                            }}
                            title="Edit Coupon"
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Duplicate Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setIsDuplicate(true);
                              setIsFormOpen(true);
                            }}
                            title="Duplicate as New Coupon"
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingCoupon(coupon)}
                            title="Delete Coupon"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Form Modal */}
      {isFormOpen && (
        <CouponFormModal
          isOpen={isFormOpen}
          coupon={editingCoupon}
          isDuplicate={isDuplicate}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCoupon(null);
            setIsDuplicate(false);
          }}
          onSaved={handleSavedCoupon}
        />
      )}

      {/* Delete Safeguard Modal */}
      {deletingCoupon && (
        <CouponDeleteModal
          isOpen={Boolean(deletingCoupon)}
          coupon={deletingCoupon}
          onClose={() => setDeletingCoupon(null)}
          onDeleted={handleDeletedCoupon}
        />
      )}
    </div>
  );
}
