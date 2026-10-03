export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-5 h-28" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 h-28" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 h-28" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 h-28" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 h-64" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 h-64" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 h-64" />
    </div>
  );
}
