import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { getAdminDashboardData } from "@/features/admin/queries/get-admin-dashboard";
import { DashboardMetricCards } from "@/features/admin/components/dashboard-metric-cards";
import { SalesTrendChart } from "@/features/admin/components/sales-trend-chart";
import { LowStockList } from "@/features/admin/components/low-stock-list";
import { RecentOrdersTable } from "@/features/admin/components/recent-orders-table";
import { ArrowUpRight, ShieldCheck, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard Overview | Velaash Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login?returnUrl=/admin");
  }

  const dashboardData = await getAdminDashboardData(admin);
  const isOwner = admin.role === "owner";

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Store Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status and inventory monitoring for{" "}
            <span className="font-semibold text-slate-700">Velaash Luxury Pret</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Role: {isOwner ? "Proprietor (Owner)" : "Fulfillment Staff"}</span>
          </span>
        </div>
      </div>

      {/* Role-Aware Metric Cards */}
      <DashboardMetricCards
        role={admin.role}
        operational={dashboardData.operationalMetrics}
        financial={dashboardData.financialMetrics}
      />

      {/* Middle Section: Sales Trend Chart (Owner only) & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isOwner && dashboardData.financialMetrics ? (
          <>
            <div className="lg:col-span-2">
              <SalesTrendChart data={dashboardData.financialMetrics.salesTrend14Days} />
            </div>
            <div>
              <LowStockList items={dashboardData.lowStockItems} />
            </div>
          </>
        ) : (
          <div className="lg:col-span-3">
            <LowStockList items={dashboardData.lowStockItems} />
          </div>
        )}
      </div>

      {/* Bottom Section: Recent Orders Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Recent Customer Orders</h2>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <RecentOrdersTable orders={dashboardData.recentOrders} />
      </div>
    </div>
  );
}
