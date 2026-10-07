import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserSession } from "@/features/auth/types";
import type {
  AdminDashboardData,
  OperationalMetrics,
  OwnerFinancialMetrics,
  RecentOrderRow,
  LowStockAlertItem,
  DailySalesData,
} from "../types";
import { formatDateIST } from "@/lib/utils";

/**
 * Shape returned by the get_admin_dashboard_metrics Postgres RPC (migration 031).
 */
interface DashboardRpcResult {
  operational: {
    pendingOrdersCount: number;
    ordersNeedingActionCount: number;
    lowStockCount: number;
    totalOrdersCount: number;
  };
  financial: {
    totalRevenue: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    aov: number;
    salesTrend14Days: { date: string; revenue: number; orders: number }[];
  } | null;
}

/**
 * Fetches role-aware metrics, recent orders, inventory alerts, and analytics.
 *
 * Operational metrics + financial aggregates are now resolved via a single
 * get_admin_dashboard_metrics() Postgres RPC call instead of 10 separate queries.
 * Staff members will NEVER receive financial metrics (revenue, AOV, sales trends) —
 * the RPC enforces this at the database boundary.
 */
export async function getAdminDashboardData(
  admin: AdminUserSession
): Promise<AdminDashboardData> {
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    const serverClient = await createClient();
    supabase = serverClient as unknown as ReturnType<typeof createAdminClient>;
  }

  // ── 1. Single RPC replaces 10 separate COUNT / SUM queries ────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcErr } = await (supabase as any).rpc(
    "get_admin_dashboard_metrics",
    { p_role: admin.role }
  );

  if (rpcErr) {
    console.warn("Dashboard metrics RPC error:", rpcErr.message);
  }

  const metrics = rpcData as DashboardRpcResult | null;

  const operationalMetrics: OperationalMetrics = {
    pendingOrdersCount: metrics?.operational?.pendingOrdersCount ?? 0,
    ordersNeedingActionCount: metrics?.operational?.ordersNeedingActionCount ?? 0,
    lowStockCount: metrics?.operational?.lowStockCount ?? 0,
    totalOrdersCount: metrics?.operational?.totalOrdersCount ?? 0,
  };

  // ── 2. Recent 10 Orders — slim select, no financial data needed ───────────
  const { data: rawOrders, error: ordersErr } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_id,
      status,
      payment_status,
      total_amount,
      shipping_address,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (ordersErr) {
    console.warn("Dashboard recent orders query notice:", ordersErr.message);
  }

  const recentOrders: RecentOrderRow[] = (rawOrders ?? []).map((order) => {
    const addr = order.shipping_address as { fullName?: string; full_name?: string; phone?: string; email?: string } | null;
    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: addr?.fullName || addr?.full_name || "Customer",
      customerPhone: addr?.phone || null,
      customerEmail: addr?.email || null,
      status: order.status,
      paymentStatus: order.payment_status,
      totalAmount: Number(order.total_amount || 0),
      createdAt: order.created_at,
    };
  });

  // ── 3. Low Stock Alerts — uses partial index idx_variants_low_stock ────────
  const { data: rawVariants, error: variantsErr } = await supabase
    .from("product_variants")
    .select(`
      id,
      product_id,
      size,
      color,
      sku,
      stock_quantity,
      products (
        id,
        name,
        slug
      )
    `)
    .lte("stock_quantity", 5)
    .eq("is_active", true)
    .order("stock_quantity", { ascending: true })
    .limit(8);

  if (variantsErr) {
    console.warn("Dashboard low stock alerts query notice:", variantsErr.message);
  }

  const lowStockItems: LowStockAlertItem[] = (rawVariants ?? []).map((v) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = v.products as any;
    return {
      variantId: v.id,
      productId: v.product_id,
      productName: product?.name ?? "Apparel Item",
      productSlug: product?.slug ?? "",
      size: v.size,
      color: v.color,
      sku: v.sku,
      stockQuantity: v.stock_quantity,
    };
  });

  // ── 4. Financial metrics — map from RPC result (owner only) ───────────────
  let financialMetrics: OwnerFinancialMetrics | null = null;

  if (admin.role === "owner" && metrics?.financial) {
    const fin = metrics.financial;

    // RPC returns ISO date strings (YYYY-MM-DD); format them for the chart
    const salesTrend14Days: DailySalesData[] = (fin.salesTrend14Days ?? []).map((row) => {
      const formattedDate = formatDateIST(row.date, {
        month: "short",
        day: "numeric",
      });
      return {
        date: formattedDate,
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders ?? 0),
      };
    });

    financialMetrics = {
      totalRevenue: Number(fin.totalRevenue ?? 0),
      revenueToday: Number(fin.revenueToday ?? 0),
      revenueThisWeek: Number(fin.revenueThisWeek ?? 0),
      revenueThisMonth: Number(fin.revenueThisMonth ?? 0),
      aov: Number(fin.aov ?? 0),
      salesTrend14Days,
    };
  }

  return {
    role: admin.role,
    operationalMetrics,
    financialMetrics,
    recentOrders,
    lowStockItems,
  };
}
