import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, hasAdminPermission } from "@/features/auth/queries/get-admin-user";
import { getAdminOrderDetail } from "@/features/admin/queries/get-admin-orders";
import { generateInvoicePdfBuffer } from "@/features/admin/services/invoice-pdf";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const admin = await getAdminUser();
    if (!admin || !hasAdminPermission(admin.role, "view_orders")) {
      return new NextResponse("Unauthorized: Insufficient permissions to view order invoices.", {
        status: 403,
      });
    }

    const { orderNumber } = await context.params;
    if (!orderNumber) {
      return new NextResponse("Missing order number.", { status: 400 });
    }

    const order = await getAdminOrderDetail(orderNumber);
    if (!order) {
      return new NextResponse("Order not found.", { status: 404 });
    }

    // Read GST configuration from site_settings
    let gstEnabled = false;
    let gstin: string | null = null;

    try {
      const adminSupabase = createAdminClient();
      const { data: taxRow } = await adminSupabase
        .from("site_settings")
        .select("value")
        .eq("key", "tax_settings")
        .maybeSingle();

      if (taxRow?.value && typeof taxRow.value === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = taxRow.value as any;
        gstEnabled = Boolean(val.gst_enabled);
        gstin = val.gstin ? String(val.gstin) : null;
      }
    } catch (err) {
      console.warn("Notice: could not load tax_settings from site_settings, defaulting to GST disabled:", err);
    }

    const pdfBuffer = await generateInvoicePdfBuffer(order, gstEnabled, gstin);

    // Return PDF stream
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to generate order invoice PDF:", error);
    return new NextResponse("Failed to generate order invoice.", { status: 500 });
  }
}
