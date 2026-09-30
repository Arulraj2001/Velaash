import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { hasAdminPermission } from "@/features/admin/permissions";
import { getAdminHomepageSectionsAction } from "@/features/admin/actions/homepage-actions";
import { getProducts } from "@/features/products";
import { HomepageBuilderView } from "@/features/admin/components/homepage/homepage-builder-view";

export const metadata: Metadata = {
  title: "Homepage Builder | Admin | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHomepageBuilderPage() {
  const admin = await getAdminUser();

  if (!admin || !hasAdminPermission(admin.role, "manage_homepage")) {
    redirect("/admin");
  }

  const [sections, { products: allProducts }] = await Promise.all([
    getAdminHomepageSectionsAction(),
    getProducts({ limit: 100 }),
  ]);

  return (
    <div className="py-2">
      <HomepageBuilderView
        initialSections={sections}
        allProducts={allProducts}
      />
    </div>
  );
}
