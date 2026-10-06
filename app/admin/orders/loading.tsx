import React from "react";

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Status Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-24 shrink-0 bg-slate-200 rounded-xl" />
        ))}
      </div>

      {/* Search & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="h-9 w-full sm:w-80 bg-slate-100 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-slate-100 rounded-xl" />
          <div className="h-9 w-32 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Orders Table Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>

        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="h-4 w-28 bg-slate-200 rounded font-mono" />
                <div className="h-3 w-40 bg-slate-100 rounded" />
              </div>
              <div className="hidden sm:block space-y-1">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
              <div className="h-6 w-24 bg-slate-200 rounded-full" />
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
