import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import { getAdminOrderDetail } from "@/features/admin/queries/get-admin-orders";
import { AdminOrderDetailView } from "@/features/admin/components/admin-order-detail-view";

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

  return <AdminOrderDetailView order={order} role={admin.role} />;
}
