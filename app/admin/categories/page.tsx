import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import { hasAdminPermission } from "@/features/admin/permissions";
import { getAdminCategoriesTree } from "@/features/admin/queries/get-admin-categories";
import { CategoryTreeView } from "@/features/admin/components/category-tree-view";

export const metadata: Metadata = {
  title: "Category Management | Velaash Admin",
};

export default async function AdminCategoriesPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login?returnUrl=/admin/categories");
  }

  await requireAdmin("view_categories");
  const isOwner = hasAdminPermission(admin.role, "manage_categories");

  const { tree, topLevelCategories, totalCategoriesCount } =
    await getAdminCategoriesTree();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Categories &amp; Navigation Taxonomies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-level category hierarchy, drag-and-drop display order, and
            category default size guides ({totalCategoriesCount} total taxonomies).
          </p>
        </div>
      </div>

      {/* Main Interactive Category Tree */}
      <CategoryTreeView
        initialTree={tree}
        topLevelCategories={topLevelCategories}
        isOwner={isOwner}
      />
    </div>
  );
}
