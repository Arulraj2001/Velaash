import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";

interface AdminProductSlugPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductSlugPage({
  params,
}: AdminProductSlugPageProps) {
  const admin = await getAdminUser();
  const { id } = await params;

  if (!admin) {
    redirect(`/admin/login?returnUrl=/admin/products/${id}`);
  }

  if (admin.role === "owner") {
    redirect(`/admin/products/${id}/edit`);
  } else {
    redirect(`/admin/products?openQuickEdit=${id}`);
  }
}
