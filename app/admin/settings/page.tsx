import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { hasAdminPermission } from "@/features/admin/permissions";
import { getSiteSettings } from "@/features/settings";
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

  const siteSettings = await getSiteSettings();

  return (
    <div className="py-2">
      <SiteSettingsView initialSettings={siteSettings} />
    </div>
  );
}
