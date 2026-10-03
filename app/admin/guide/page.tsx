import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { AdminGuideView } from "@/features/admin/components/guide/admin-guide-view";

export const metadata: Metadata = {
  title: "Admin Operations & Training Guide | Velaash",
  description: "Step-by-step operational handbook for store staff and business owners.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminGuidePage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="py-2">
      <AdminGuideView role={admin.role} adminName={admin.fullName} />
    </div>
  );
}
