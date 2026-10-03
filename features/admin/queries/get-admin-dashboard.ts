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

/**
 * Fetches role-aware metrics, recent orders, inventory alerts, and analytics.
 * Staff members will NEVER receive financial metrics (revenue, AOV, sales trends) —
 * these are explicitly withheld at the query boundary.
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

  // 1. Operational Counts
  const [
    { count: pendingCount, error: pendingErr },
    { count: confirmedCount, error: confirmedErr },
    { count: pendingPaidCount, error: pendingPaidErr },
    { count: totalOrdersCount, error: totalErr },
    { count: lowStockCount, error: lowStockErr },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "paid"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .lte("stock_quantity", 5)
      .eq("is_active", true),
  ]);

  if (pendingErr) console.warn("Dashboard pending orders query notice:", pendingErr.message);
  if (confirmedErr) console.warn("Dashboard confirmed orders query notice:", confirmedErr.message);
  if (pendingPaidErr) console.warn("Dashboard pending paid orders query notice:", pendingPaidErr.message);
  if (totalErr) console.warn("Dashboard total orders query notice:", totalErr.message);
  if (lowStockErr) console.warn("Dashboard low stock query notice:", lowStockErr.message);

  // An order qualifies as needing action if it is confirmed OR pending and already paid
  const ordersNeedingActionCount = (confirmedCount ?? 0) + (pendingPaidCount ?? 0);

  const operationalMetrics: OperationalMetrics = {
    pendingOrdersCount: pendingCount ?? 0,
    ordersNeedingActionCount,
    lowStockCount: lowStockCount ?? 0,
    totalOrdersCount: totalOrdersCount ?? 0,
  };

  // 2. Recent 10 Orders (visible to both Owner and Staff for fulfillment)
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
    // Attempt parsing customer name & contact from shipping_address snapshot (supports both fullName and full_name)
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

  // 3. Low Stock Alerts (products/variants <= 5 inventory)
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

  // 4. Financial & Revenue Metrics (Strictly withheld if role is NOT 'owner')
  let financialMetrics: OwnerFinancialMetrics | null = null;

  if (admin.role === "owner") {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Run all revenue aggregation queries in parallel using targeted date filters
    // Instead of downloading ALL rows and summing in JS, filter in Postgres
    const [
      { data: allTimePaid, error: allTimeErr },
      { data: todayPaid, error: todayErr },
      { data: weekPaid, error: weekErr },
      { data: monthPaid, error: monthErr },
      { data: trendRows, error: trendErr },
    ] = await Promise.all([
      // Total all-time: only fetch total_amount (no created_at needed)
      supabase
        .from("orders")
        .select("total_amount")
        .in("payment_status", ["paid"])
        .neq("status", "cancelled"),
      // Today
      supabase
        .from("orders")
        .select("total_amount")
        .in("payment_status", ["paid"])
        .neq("status", "cancelled")
        .gte("created_at", startOfToday),
      // Last 7 days
      supabase
        .from("orders")
        .select("total_amount")
        .in("payment_status", ["paid"])
        .neq("status", "cancelled")
        .gte("created_at", sevenDaysAgo),
      // Last 30 days
      supabase
        .from("orders")
        .select("total_amount")
        .in("payment_status", ["paid"])
        .neq("status", "cancelled")
        .gte("created_at", thirtyDaysAgo),
      // Last 14 days (for trend chart) — only the slim data needed
      supabase
        .from("orders")
        .select("total_amount, created_at")
        .in("payment_status", ["paid"])
        .neq("status", "cancelled")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true }),
    ]);

    if (allTimeErr) console.warn("Dashboard all-time revenue query notice:", allTimeErr.message);
    if (todayErr) console.warn("Dashboard today revenue query notice:", todayErr.message);
    if (weekErr) console.warn("Dashboard weekly revenue query notice:", weekErr.message);
    if (monthErr) console.warn("Dashboard monthly revenue query notice:", monthErr.message);
    if (trendErr) console.warn("Dashboard trend query notice:", trendErr.message);

    const sumRows = (rows: { total_amount: number | null }[] | null) =>
      (rows ?? []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    const totalRevenue = sumRows(allTimePaid);
    const revenueToday = sumRows(todayPaid);
    const revenueThisWeek = sumRows(weekPaid);
    const revenueThisMonth = sumRows(monthPaid);
    const allTimeCount = (allTimePaid ?? []).length;
    const aov = allTimeCount > 0 ? Math.round(totalRevenue / allTimeCount) : 0;

    // Build 14-day chronological sales trend from the slim trendRows
    const salesTrend14Days: DailySalesData[] = [];
    for (let i = 13; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const d = targetDate.getDate();

      const dayStart = new Date(y, m, d, 0, 0, 0, 0).getTime();
      const dayEnd = new Date(y, m, d, 23, 59, 59, 999).getTime();

      const dayRows = (trendRows ?? []).filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= dayStart && t <= dayEnd;
      });

      const dayRevenue = dayRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
      const formattedDate = targetDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });

      salesTrend14Days.push({
        date: formattedDate,
        revenue: dayRevenue,
        orders: dayRows.length,
      });
    }

    financialMetrics = {
      totalRevenue,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      aov,
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
