import React from "react";

export default function AdminProductEditLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Top Bar Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-200 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-3.5 w-64 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-100 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Main 2-Column Form Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8-col Details */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
            <div className="h-28 w-full bg-slate-100 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-32 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Right 4-col Sidebar */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-24 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
