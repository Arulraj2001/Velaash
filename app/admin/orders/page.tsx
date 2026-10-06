import type { Metadata } from "next";
import { getAdminUser, hasAdminPermission } from "@/features/auth";
import { redirect } from "next/navigation";
import { getAdminOrders } from "@/features/admin/queries/get-admin-orders";
import { OrdersTable } from "@/features/admin/components/orders-table";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/features/admin/types/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders Management | Velaash Admin",
  description: "Process incoming orders, manage fulfillment stages, tracking, and invoices.",
};

interface AdminOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    filter?: string;
    coupon_code?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login?returnUrl=/admin/orders");
  }
  if (!hasAdminPermission(admin.role, "view_orders")) {
    redirect("/admin");
  }

  const resolvedParams = await searchParams;

  const result = await getAdminOrders({
    search: resolvedParams.search,
    status: (resolvedParams.status as OrderStatus) || "all",
    paymentMethod: (resolvedParams.paymentMethod as PaymentMethod) || "all",
    paymentStatus: (resolvedParams.paymentStatus as PaymentStatus) || "all",
    filter: resolvedParams.filter === "needs_action" ? "needs_action" : "all",
    couponCode: resolvedParams.coupon_code,
    sortBy: (resolvedParams.sortBy as "date" | "total" | "status" | "needs_action") || "date",
    sortOrder: (resolvedParams.sortOrder as "asc" | "desc") || "desc",
    dateFrom: resolvedParams.dateFrom,
    dateTo: resolvedParams.dateTo,
    page: resolvedParams.page ? Number(resolvedParams.page) : 1,
    pageSize: 100, // Load comprehensive batch for responsive TanStack table filtering
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Orders Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process customer orders, update fulfillment stages, enter courier tracking, and generate invoices.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <OrdersTable
        orders={result.orders}
        role={admin.role}
        needsActionCount={result.needsActionCount}
        initialFilter={resolvedParams.filter}
        initialCouponCode={resolvedParams.coupon_code}
      />
    </div>
  );
}
