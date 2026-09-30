"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { DailySalesData } from "../types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Calendar } from "lucide-react";

interface SalesTrendChartProps {
  data: DailySalesData[];
}

const emptySubscribe = () => () => {};

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");

  const totalPeriodRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalPeriodOrders = data.reduce((sum, item) => sum + item.orders, 0);

  if (!mounted) {
    return (
      <div className="h-72 w-full animate-pulse rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Loading analytics visualization...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      {/* Header and Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">14-Day Performance Trend</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {metric === "revenue"
              ? `Total 14-day revenue: ${formatCurrency(totalPeriodRevenue)}`
              : `Total 14-day orders placed: ${totalPeriodOrders}`}
          </p>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMetric("revenue")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              metric === "revenue"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetric("orders")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              metric === "orders"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Orders Count
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(val) =>
                metric === "revenue" ? `₹${(val / 1000).toFixed(0)}k` : val
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const current = payload[0].payload as DailySalesData;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs font-sans">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>{current.date}</span>
                      </div>
                      <div className="font-semibold text-slate-900">
                        Revenue: {formatCurrency(current.revenue)}
                      </div>
                      <div className="text-slate-600">Orders: {current.orders}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {metric === "revenue" ? (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ordersGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
