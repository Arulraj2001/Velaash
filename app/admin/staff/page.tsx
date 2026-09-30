import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser, requireOwner } from "@/features/auth";
import { getAdminUsersList } from "@/features/admin/actions/staff-actions";
import { StaffManagementView } from "@/features/admin/components/staff-management-view";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Staff & Role Management | Velaash Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminStaffPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login?returnUrl=/admin/staff");
  }

  // Hard-block non-owners at the server level
  if (admin.role !== "owner") {
    redirect("/admin");
  }

  // Double-check via requireOwner() and retrieve admin list
  await requireOwner();
  const staffMembers = await getAdminUsersList();

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Staff &amp; Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage administrative privileges, assign operational roles, and onboard team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Proprietor Exclusive Access</span>
          </span>
        </div>
      </div>

      <StaffManagementView currentAdmin={admin} staffMembers={staffMembers} />
    </div>
  );
}
