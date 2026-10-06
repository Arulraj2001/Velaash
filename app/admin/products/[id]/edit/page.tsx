import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminUser, hasAdminPermission } from "@/features/auth";
import {
  getAdminProductById,
  getCategoriesForSelect,
  getSizeChartsForSelect,
} from "@/features/admin/queries/get-admin-products";
import { ProductForm } from "@/features/admin/components/product-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Product | Velaash Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const { id } = await params;
  const admin = await getAdminUser();
  if (!admin) {
    redirect(`/admin/login?returnUrl=/admin/products/${id}/edit`);
  }

  // Hard-block non-owners at the server level: staff cannot access full edit form
  if (admin.role !== "owner" || !hasAdminPermission(admin.role, "manage_products")) {
    redirect("/admin/products?error=unauthorized_owner_only");
  }

  const [product, categories, sizeCharts] = await Promise.all([
    getAdminProductById(id),
    getCategoriesForSelect(),
    getSizeChartsForSelect(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialData={product}
      categories={categories}
      sizeCharts={sizeCharts}
    />
  );
}
