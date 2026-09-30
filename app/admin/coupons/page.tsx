import type { Metadata } from "next";
import { getAdminUser, requireOwner } from "@/features/auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getAdminCoupons } from "@/features/admin/queries/get-admin-coupons";
import { CouponsTable } from "@/features/admin/components/coupons-table";

export const metadata: Metadata = {
  title: "Coupons & Discounts | Velaash Admin",
  description: "Configure discount codes, percentage cuts, flat deductions, and minimum cart rules.",
};

export default async function AdminCouponsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login?returnUrl=/admin/coupons");

  // OWNER ONLY: Staff members are denied access and redirected away immediately
  if (admin.role !== "owner") {
    redirect("/admin");
  }
  await requireOwner();

  const coupons = await getAdminCoupons();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Promotions &amp; Coupons
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure promotional discount codes, percentage cuts, flat deductions, and minimum order rules.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 self-start sm:self-auto shadow-2xs">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Owner Exclusive</span>
        </span>
      </div>

      {/* Main Coupons Table */}
      <CouponsTable initialCoupons={coupons} />
    </div>
  );
}
