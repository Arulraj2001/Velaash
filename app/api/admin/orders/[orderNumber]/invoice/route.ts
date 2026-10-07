import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, hasAdminPermission } from "@/features/auth/queries/get-admin-user";
import { getAdminOrderDetail } from "@/features/admin/queries/get-admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Seamlessly redirect to the robust printable invoice view with autoPrint enabled.
    // This completely eliminates serverless binary PDF crashes (HTTP 502) while offering instant browser printing and PDF generation.
    const invoiceUrl = new URL(`/admin/orders/${orderNumber}/invoice?autoPrint=true`, request.url);
    return NextResponse.redirect(invoiceUrl, 307);
  } catch (error) {
    console.error("Failed to process order invoice request:", error);
    return new NextResponse("Failed to process order invoice.", { status: 500 });
  }
}
