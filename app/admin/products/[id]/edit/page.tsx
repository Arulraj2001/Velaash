import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import {
  getAdminProductById,
  getCategoriesForSelect,
  getSizeChartsForSelect,
} from "@/features/admin/queries/get-admin-products";
import { ProductForm } from "@/features/admin/components/product-form";

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
  const admin = await requireAdmin("manage_products");

  // Hard-block non-owners at the server level: staff cannot access full edit form
  if (admin.role !== "owner") {
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
