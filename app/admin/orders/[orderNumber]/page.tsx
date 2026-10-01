import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import { getAdminOrderDetail } from "@/features/admin/queries/get-admin-orders";
import { AdminOrderDetailView } from "@/features/admin/components/admin-order-detail-view";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LogisticsMode } from "@/features/settings/types";

interface AdminOrderDetailPageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function generateMetadata(
  props: AdminOrderDetailPageProps
): Promise<Metadata> {
  const { orderNumber } = await props.params;
  return {
    title: `Order #${orderNumber} | Velaash Admin`,
    description: `Manage fulfillment, status transitions, tracking details, and invoices for order #${orderNumber}.`,
  };
}

export default async function AdminOrderDetailPage(
  props: AdminOrderDetailPageProps
) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login?returnUrl=/admin/orders");
  }

  await requireAdmin("view_orders");

  const { orderNumber } = await props.params;
  if (!orderNumber) {
    notFound();
  }

  const order = await getAdminOrderDetail(orderNumber);
  if (!order) {
    notFound();
  }

  // Fetch logistics mode from site settings (defaults to "manual" if not set)
  let logisticsMode: LogisticsMode = "manual";
  try {
    const adminSupabase = createAdminClient();
    const { data: srRow } = await adminSupabase
      .from("site_settings")
      .select("value")
      .eq("key", "shiprocket_settings")
      .maybeSingle();
    if (srRow?.value) {
      const srSettings = srRow.value as { logistics_mode?: LogisticsMode };
      logisticsMode = srSettings.logistics_mode ?? "manual";
    }
  } catch {
    // Default to manual on error — safe fallback
  }

  return (
    <AdminOrderDetailView
      order={order}
      role={admin.role}
      logisticsMode={logisticsMode}
    />
  );
}
