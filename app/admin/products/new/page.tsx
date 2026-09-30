import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import {
  getCategoriesForSelect,
  getSizeChartsForSelect,
} from "@/features/admin/queries/get-admin-products";
import { ProductForm } from "@/features/admin/components/product-form";

export const metadata: Metadata = {
  title: "New Product | Velaash Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewProductPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login?returnUrl=/admin/products/new");
  }

  // Hard-block non-owners at the server level: staff cannot access add form
  if (admin.role !== "owner") {
    redirect("/admin/products?error=unauthorized_owner_only");
  }

  await requireAdmin("manage_products");

  const [categories, sizeCharts] = await Promise.all([
    getCategoriesForSelect(),
    getSizeChartsForSelect(),
  ]);

  return (
    <ProductForm
      initialData={null}
      categories={categories}
      sizeCharts={sizeCharts}
    />
  );
}
