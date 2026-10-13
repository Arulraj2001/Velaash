import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { hasAdminPermission } from "@/features/admin/permissions";
import { MediaGalleryView } from "@/features/admin/components/media/media-gallery-view";

export const metadata: Metadata = {
  title: "Media Storage & Asset Gallery | Admin | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminMediaPage() {
  const admin = await getAdminUser();

  if (!admin || !hasAdminPermission(admin.role, "manage_products")) {
    redirect("/admin");
  }

  return (
    <div className="py-2">
      <MediaGalleryView />
    </div>
  );
}
