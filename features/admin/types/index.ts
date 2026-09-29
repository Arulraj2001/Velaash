import { z } from "zod";

export const AdminDashboardStatsSchema = z.object({
  totalRevenue: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  totalCustomers: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
});

export const InventoryUpdateSchema = z.object({
  variantId: z.string().uuid(),
  stockQuantity: z.number().int().nonnegative(),
});

export type AdminDashboardStats = z.infer<typeof AdminDashboardStatsSchema>;
export type InventoryUpdateInput = z.infer<typeof InventoryUpdateSchema>;
