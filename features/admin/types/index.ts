import type { AdminRole, OrderStatus, PaymentStatus } from "@/types/database.types";

export interface RecentOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
}

export interface LowStockAlertItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  sku: string;
  stockQuantity: number;
}

export interface DailySalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface OperationalMetrics {
  pendingOrdersCount: number;
  ordersNeedingActionCount: number; // confirmed orders waiting for fulfillment
  lowStockCount: number;
  totalOrdersCount: number;
}

export interface OwnerFinancialMetrics {
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  aov: number;
  salesTrend14Days: DailySalesData[];
}

export interface AdminDashboardData {
  role: AdminRole;
  operationalMetrics: OperationalMetrics;
  financialMetrics: OwnerFinancialMetrics | null; // Null for staff role
  recentOrders: RecentOrderRow[];
  lowStockItems: LowStockAlertItem[];
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  createdAt: string;
}

export * from "./products";
export * from "./categories";
export * from "./orders";
export * from "./coupons";


