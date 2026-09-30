"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AdminRole } from "@/types/database.types";
import type { OperationalMetrics, OwnerFinancialMetrics } from "../types";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertTriangle,
  PackageCheck,
} from "lucide-react";


interface DashboardMetricCardsProps {
  role: AdminRole;
  operational: OperationalMetrics;
  financial: OwnerFinancialMetrics | null;
}

export function DashboardMetricCards({
  role,
  operational,
  financial,
}: DashboardMetricCardsProps) {
  const isOwner = role === "owner" && financial !== null;
  const [revenueTimeframe, setRevenueTimeframe] = useState<
    "all" | "month" | "week" | "today"
  >("all");

  const getDisplayedRevenue = () => {
    if (!financial) return 0;
    switch (revenueTimeframe) {
      case "today":
        return financial.revenueToday;
      case "week":
        return financial.revenueThisWeek;
      case "month":
        return financial.revenueThisMonth;
      case "all":
      default:
        return financial.totalRevenue;
    }
  };

  const getTimeframeLabel = () => {
    switch (revenueTimeframe) {
      case "today":
        return "Today";
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 30 Days";
      case "all":
      default:
        return "All Time";
    }
  };

  if (!isOwner) {
    // STAFF OPERATIONAL CARDS ONLY (NO FINANCIALS)
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Action Needed */}
        <Link
          href="/admin/orders?filter=needs_action"
          className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-2xs hover:bg-blue-50/70 hover:border-blue-300 transition-colors block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-950">Orders Needing Action</span>
            <div className="rounded-lg bg-blue-600 text-white p-2">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {operational.ordersNeedingActionCount}
            </span>
            <p className="mt-1 text-[11px] text-blue-700 font-medium group-hover:underline">
              Confirmed, awaiting pack/ship →
            </p>
          </div>
        </Link>

        {/* Pending Orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Orders</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {operational.pendingOrdersCount}
            </span>
            <p className="mt-1 text-[11px] text-slate-500">Awaiting payment verification</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Low Stock Variants</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {operational.lowStockCount}
            </span>
            <p className="mt-1 text-[11px] text-slate-500">SKUs with 5 or fewer units</p>
          </div>
        </div>
      </div>
    );
  }

  // OWNER METRICS (Includes Financials with Timeframe Toggle)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Revenue with Timeframe Toggle */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Net Revenue</span>
                <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                  ({getTimeframeLabel()})
                </span>
              </div>
            </div>

            {/* Timeframe Toggle Buttons */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setRevenueTimeframe("today")}
                className={`rounded px-1.5 py-0.5 transition-colors ${
                  revenueTimeframe === "today"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setRevenueTimeframe("week")}
                className={`rounded px-1.5 py-0.5 transition-colors ${
                  revenueTimeframe === "week"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setRevenueTimeframe("month")}
                className={`rounded px-1.5 py-0.5 transition-colors ${
                  revenueTimeframe === "month"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => setRevenueTimeframe("all")}
                className={`rounded px-1.5 py-0.5 transition-colors ${
                  revenueTimeframe === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(getDisplayedRevenue())}
            </span>
            <p className="mt-1 text-[11px] text-slate-500">
              Verified paid transactions through Razorpay & settled orders
            </p>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <Link
          href={operational.ordersNeedingActionCount > 0 ? "/admin/orders?filter=needs_action" : "/admin/orders"}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-colors block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Orders</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {operational.totalOrdersCount}
            </span>
            <p className="mt-1 text-[11px] text-slate-500 group-hover:text-blue-600">
              {operational.ordersNeedingActionCount > 0 ? (
                <span className="text-blue-600 font-medium">
                  {operational.ordersNeedingActionCount} need action →
                </span>
              ) : (
                "Lifetime orders placed →"
              )}
            </p>
          </div>
        </Link>

        {/* Card 3: Average Order Value */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg. Order Value</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(financial.aov)}
            </span>
            <p className="mt-1 text-[11px] text-slate-500">Revenue / paid orders</p>
          </div>
        </div>

        {/* Card 4: Pending / Low Stock */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Needs Attention</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {operational.pendingOrdersCount}
            </span>
            <span className="text-xs text-slate-500">pending</span>
            <span className="text-slate-300">•</span>
            <span className="text-lg font-semibold text-rose-600">
              {operational.lowStockCount}
            </span>
            <span className="text-[11px] text-slate-500">low stock</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Pending &amp; stock alert items</p>
        </div>
      </div>
    </div>
  );
}
