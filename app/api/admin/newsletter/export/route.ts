import { NextResponse } from "next/server";
import { getAdminUser, hasAdminPermission } from "@/features/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin || !hasAdminPermission(admin.role, "manage_settings")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = createAdminClient();
  const rows: Array<{ email: string; subscribed_at: string; is_active: boolean }> = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, subscribed_at, is_active")
      .order("subscribed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Newsletter export failed:", error);
      return new NextResponse("Could not export newsletter subscribers.", { status: 500 });
    }

    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  const csv = [
    "email,subscribed_at,is_active",
    ...rows.map((row) =>
      [row.email, row.subscribed_at, row.is_active ? "true" : "false"].map(csvCell).join(",")
    ),
  ].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="velaash-newsletter-subscribers.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}