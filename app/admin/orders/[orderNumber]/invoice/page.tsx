import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import { getAdminOrderDetail } from "@/features/admin/queries/get-admin-orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderInvoicePrintable } from "@/features/admin/components/invoice/order-invoice-printable";

interface InvoicePageProps {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    autoPrint?: string;
  }>;
}

export async function generateMetadata(props: InvoicePageProps): Promise<Metadata> {
  const { orderNumber } = await props.params;
  return {
    title: `Invoice #${orderNumber} | Velaash Admin`,
    description: `Official Tax Invoice & Bill of Supply for order #${orderNumber}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminOrderInvoicePage(props: InvoicePageProps) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }

  await requireAdmin("view_orders");

  const { orderNumber } = await props.params;
  const { autoPrint } = await props.searchParams;

  if (!orderNumber) {
    notFound();
  }

  const order = await getAdminOrderDetail(orderNumber);
  if (!order) {
    notFound();
  }

  // Read GST & Store Profile configuration from site_settings
  let gstEnabled = false;
  let gstin: string | null = null;
  let storeProfile: {
    name?: string;
    legal_name?: string;
    email?: string;
    phone?: string;
  } | null = null;

  try {
    const adminSupabase = createAdminClient();
    const { data: settingsRows } = await adminSupabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["tax_settings", "store_profile"]);

    const taxRow = settingsRows?.find((r) => r.key === "tax_settings");
    if (taxRow?.value && typeof taxRow.value === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = taxRow.value as any;
      gstEnabled = Boolean(val.gst_enabled);
      gstin = val.gstin ? String(val.gstin) : null;
    }

    const storeProfileRow = settingsRows?.find((r) => r.key === "store_profile");
    if (storeProfileRow?.value && typeof storeProfileRow.value === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = storeProfileRow.value as any;
      storeProfile = {
        name: profile.name,
        legal_name: profile.legal_name,
        email: profile.email,
        phone: profile.phone || profile.whatsapp_number,
      };
    }
  } catch {
    // Fallbacks handled gracefully
  }

  return (
    <OrderInvoicePrintable
      order={order}
      storeProfile={storeProfile}
      gstEnabled={gstEnabled}
      gstin={gstin}
      autoPrint={autoPrint === "true"}
    />
  );
}
