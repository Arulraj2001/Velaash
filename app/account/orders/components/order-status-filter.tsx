"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export function OrderStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("status");
    } else {
      params.set("status", val);
    }
    params.delete("page"); // Reset page when filter changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-brand-muted shrink-0" />
      <select
        id="order-status-filter-select"
        value={currentStatus}
        onChange={handleChange}
        className="rounded-xl border border-brand-border/80 bg-white px-3 py-2 text-xs font-medium text-brand-dark shadow-sm focus:border-brand-accent focus:outline-none transition-colors cursor-pointer"
        aria-label="Filter orders by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
