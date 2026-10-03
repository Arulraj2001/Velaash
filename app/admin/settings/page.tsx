import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { hasAdminPermission } from "@/features/admin/permissions";
import { getSiteSettings, getFeaturedProductThumbnail } from "@/features/settings";
import { getActiveCoupons } from "@/features/admin/queries/get-active-coupons";
import { SiteSettingsView } from "@/features/admin/components/settings/site-settings-view";

export const metadata: Metadata = {
  title: "Site Settings | Admin | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSiteSettingsPage() {
  const admin = await getAdminUser();

  if (!admin || !hasAdminPermission(admin.role, "manage_settings")) {
    redirect("/admin");
  }

  const [siteSettings, activeCoupons, featuredProduct] = await Promise.all([
    getSiteSettings(),
    getActiveCoupons(),
    getFeaturedProductThumbnail(),
  ]);

  return (
    <div className="py-2">
      <Link
        href="/admin/settings/newsletter"
        className="mb-4 inline-flex h-9 items-center rounded border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Manage newsletter subscribers
      </Link>
      <SiteSettingsView
        initialSettings={siteSettings}
        activeCoupons={activeCoupons}
        featuredProduct={featuredProduct}
      />
    </div>
  );
}
