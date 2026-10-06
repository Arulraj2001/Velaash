import React from "react";

export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* KPI Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
          >
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Filters & Search Toolbar Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="h-9 w-full sm:w-72 bg-slate-100 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-36 bg-slate-100 rounded-xl" />
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-100 rounded" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-10 shrink-0 bg-slate-200 rounded-lg" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-4 w-44 sm:w-64 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="hidden sm:block h-4 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
