import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "@/features/auth";
import {
  getAdminProductsList,
  getCategoriesForSelect,
} from "@/features/admin/queries/get-admin-products";
import { ProductsTable } from "@/features/admin/components/products-table";
import { Package, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Products & Inventory | Velaash Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProductsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login?returnUrl=/admin/products");
  }

  // Ensure caller has at least view_products permission
  await requireAdmin("view_products");

  const [products, categories] = await Promise.all([
    getAdminProductsList(),
    getCategoriesForSelect(),
  ]);

  const isOwner = admin.role === "owner";
  const activeCount = products.filter((p) => p.is_active).length;
  const lowStockCount = products.filter((p) => p.total_stock > 0 && p.total_stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.total_stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Products &amp; Inventory Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOwner
              ? "Full catalog control: manage pricing, apparel variants, media lookbooks, and SKU allocations."
              : "Operational catalog view: monitor variant inventory and perform stock adjustments."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Role: {isOwner ? "Owner (Full CRUD)" : "Staff (Stock Quick-Edit Only)"}</span>
          </span>
        </div>
      </div>

      {/* Inventory Status Chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Catalog
          </span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{products.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Styles defined</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Online
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Visible on storefront</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Low Stock (&le; 5)
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-600">{lowStockCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Replenishment needed</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Out of Stock
          </span>
          <div className="mt-1 text-2xl font-bold text-rose-600">{outOfStockCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Zero inventory</p>
        </div>
      </div>

      {/* Products TanStack Table Component */}
      <ProductsTable
        products={products}
        categories={categories}
        role={admin.role}
      />
    </div>
  );
}
