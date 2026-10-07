import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { canAccessAdminRoute } from "@/features/admin/permissions";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/admin";

  // Exclude /admin/login from the dashboard shell layout
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const admin = await getAdminUser();
  if (!admin) {
    redirect(`/admin/login?returnUrl=${encodeURIComponent(pathname)}`);
  }

  // Enforce route RBAC at the layout boundary
  if (!canAccessAdminRoute(admin.role, pathname)) {
    redirect("/admin");
  }

  // Printable invoices render standalone without dashboard topbar/sidebar navigation
  if (pathname.includes("/invoice")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <AdminSidebar admin={admin} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminTopbar admin={admin} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
