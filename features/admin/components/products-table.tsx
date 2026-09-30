"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { AdminRole } from "@/types/database.types";
import type { AdminProductListItem } from "../types/products";
import { formatCurrency } from "@/lib/utils";
import {
  toggleProductStatusAction,
  deleteProductAction,
  duplicateProductAction,
  bulkProductsAction,
} from "../actions/product-actions";
import { StockQuickEditModal } from "./stock-quick-edit-modal";
import { CsvImportModal } from "./csv-import-modal";
import {
  Search,
  Plus,
  ExternalLink,
  Edit,
  Sliders,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";


interface ProductsTableProps {
  products: AdminProductListItem[];
  categories: { id: string; name: string; slug: string }[];
  role: AdminRole;
}

const columnHelper = createColumnHelper<AdminProductListItem>();

export function ProductsTable({
  products: initialProducts,
  categories,
  role,
}: ProductsTableProps) {
  const isOwner = role === "owner";
  const [data, setData] = useState<AdminProductListItem[]>(initialProducts);
  const [sorting, setSorting] = useState<SortingState>([{ id: "updated_at", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isPending, startTransition] = useTransition();
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Quick Edit Modal state
  const [quickEditProduct, setQuickEditProduct] = useState<AdminProductListItem | null>(null);
  // CSV Import Modal state
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Filtered dataset based on category & status dropdowns
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && !item.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && item.is_active) {
        return false;
      }
      return true;
    });
  }, [data, categoryFilter, statusFilter]);

  // Actions
  const handleToggleStatus = (product: AdminProductListItem) => {
    startTransition(async () => {
      const newStatus = !product.is_active;
      const res = await toggleProductStatusAction(product.id, newStatus);
      if (res.success) {
        setData((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p))
        );
        setBannerMessage({
          type: "success",
          message: `"${product.name}" ${newStatus ? "published" : "deactivated"}.`,
        });
      } else {
        setBannerMessage({ type: "error", message: res.error || "Failed to update status." });
      }
    });
  };

  const handleDuplicate = (productId: string) => {
    startTransition(async () => {
      const res = await duplicateProductAction(productId);
      if (res.success) {
        setBannerMessage({
          type: "success",
          message: res.message || "Product duplicated as draft.",
        });
        window.location.reload();
      } else {
        setBannerMessage({ type: "error", message: res.error || "Duplication failed." });
      }
    });
  };

  const handleDelete = (product: AdminProductListItem) => {
    const confirmText = product.has_orders
      ? `"${product.name}" has existing customer orders. Deleting will deactivate it to protect customer order records. Proceed?`
      : `Are you sure you want to permanently delete "${product.name}"? This cannot be undone.`;

    if (!window.confirm(confirmText)) return;

    startTransition(async () => {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        if (res.deactivated) {
          setData((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, is_active: false } : p))
          );
          setBannerMessage({
            type: "warning",
            message: res.message || "Product deactivated to protect order history.",
          });
        } else {
          setData((prev) => prev.filter((p) => p.id !== product.id));
          setBannerMessage({
            type: "success",
            message: res.message || "Product permanently deleted.",
          });
        }
      } else {
        setBannerMessage({ type: "error", message: res.error || "Failed to delete product." });
      }
    });
  };

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedIds = selectedIndices.map((idx) => filteredData[idx]?.id).filter(Boolean);

    if (selectedIds.length === 0) return;

    if (
      action === "delete" &&
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected product(s)? Products referenced in orders will be deactivated.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await bulkProductsAction({ action, productIds: selectedIds });
      if (res.success) {
        setBannerMessage({ type: "success", message: res.message || "Bulk action completed." });
        setRowSelection({});
        window.location.reload();
      } else {
        setBannerMessage({ type: "error", message: res.error || "Bulk action failed." });
      }
    });
  };

  const handleExportCsv = () => {
    const headers =
      "name,slug,category_name,base_price,compare_at_price,total_stock,is_active,is_featured,skus,updated_at\n";
    const rows = filteredData
      .map((p) => {
        const escapedName = `"${p.name.replace(/"/g, '""')}"`;
        const skusJoined = `"${p.skus.join(", ")}"`;
        return `${escapedName},${p.slug},"${p.category_name}",${p.base_price},${p.compare_at_price || ""},${p.total_stock},${p.is_active},${p.is_featured},${skusJoined},${p.updated_at}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `velaash-catalog-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define Columns
  const columns = useMemo(() => {
    const cols = [];

    // Checkbox Column (Owner only)
    if (isOwner) {
      cols.push(
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          ),
        })
      );
    }

    cols.push(
      // Thumbnail + Product Name + Slug
      columnHelper.accessor("name", {
        header: "Product",
        cell: (info) => {
          const p = info.row.original;
          return (
            <div className="flex items-center gap-3">
              {p.thumbnail_url ? (
                <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100 border border-slate-200">
                  <Image
                    src={p.thumbnail_url}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <Package className="h-4 w-4" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                  <span className="truncate">{p.name}</span>
                  {p.is_featured && (
                    <span title="Featured Product">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  /{p.slug}
                </div>
                {p.skus.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                    SKU: {p.skus[0]} {p.skus.length > 1 ? `(+${p.skus.length - 1})` : ""}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),

      // Category
      columnHelper.accessor("category_name", {
        header: "Category",
        cell: (info) => (
          <span className="text-xs text-slate-700 font-medium">{info.getValue()}</span>
        ),
      }),

      // Price
      columnHelper.accessor("base_price", {
        header: () => <div className="text-right">Price</div>,
        cell: (info) => {
          const p = info.row.original;
          return (
            <div className="text-right">
              <div className="font-semibold text-slate-900 text-xs">
                {formatCurrency(p.base_price)}
              </div>
              {p.compare_at_price && p.compare_at_price > p.base_price && (
                <div className="text-[10px] text-slate-400 line-through">
                  {formatCurrency(p.compare_at_price)}
                </div>
              )}
            </div>
          );
        },
      }),

      // Total Stock
      columnHelper.accessor("total_stock", {
        header: () => <div className="text-center">Stock</div>,
        cell: (info) => {
          const stock = info.getValue();
          const isOut = stock === 0;
          const isLow = stock > 0 && stock <= 5;

          return (
            <div className="text-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isOut
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : isLow
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {stock} units
              </span>
            </div>
          );
        },
      }),

      // Status
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => {
          const active = info.getValue();
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              {active ? "Active" : "Draft"}
            </span>
          );
        },
      }),

      // Last Updated
      columnHelper.accessor("updated_at", {
        header: "Last Updated",
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <span className="text-[11px] text-slate-500">
              {date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
      }),

      // Row Actions
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => {
          const p = info.row.original;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* If OWNER: full edit link. If STAFF: opens stock quick-edit! */}
              {isOwner ? (
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Full product edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(p)}
                  className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                  title="Edit stock quantities"
                >
                  <Sliders className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Owner Fast Stock Quick Edit */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(p)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  title="Quick stock edit"
                >
                  <Sliders className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Live Preview Storefront link */}
              <Link
                href={`/products/${p.slug}`}
                target="_blank"
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                title="View on customer storefront"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              {/* Owner Exclusive Actions: Duplicate, Status, Delete */}
              {isOwner && (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDuplicate(p.id)}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Duplicate as draft"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleStatus(p)}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title={p.is_active ? "Deactivate product" : "Publish product"}
                  >
                    {p.is_active ? (
                      <XCircle className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(p)}
                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title={
                      p.has_orders
                        ? "Deactivate (referenced in orders)"
                        : "Permanently delete"
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        },
      })
    );

    return cols;
  }, [isOwner, isPending]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      {/* Banner feedback */}
      {bannerMessage && (
        <div
          className={`flex items-center justify-between rounded-lg border p-3 text-xs font-medium ${
            bannerMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : bannerMessage.type === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === "success" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            {bannerMessage.type === "warning" && (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            {bannerMessage.type === "error" && (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{bannerMessage.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="rounded p-1 hover:bg-black/5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Filter and Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by title, slug, or SKU..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Draft / Inactive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* CSV Export & Import (Owner only) */}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Export catalog as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCsvImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Import catalog from CSV"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import CSV</span>
              </button>

              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bulk Operations Toolbar (Owner Only when rows selected) */}
      {isOwner && selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs">
          <span className="font-semibold text-indigo-900">
            {selectedCount} product(s) selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction("activate")}
              className="rounded-md bg-white border border-indigo-200 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-50 shadow-2xs"
            >
              Activate
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction("deactivate")}
              className="rounded-md bg-white border border-indigo-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Deactivate
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction("delete")}
              className="rounded-md bg-white border border-rose-200 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-50 shadow-2xs"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-[11px] text-slate-500 hover:underline ml-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* TanStack Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/75">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-800 text-sm">No products found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Try adjusting your filters or search keywords.
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    row.getIsSelected() ? "bg-indigo-50/30" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
        <div>
          Showing{" "}
          <strong className="text-slate-800">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-800">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}
          </strong>{" "}
          of <strong className="text-slate-800">{filteredData.length}</strong> items
        </div>

        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 disabled:opacity-30 hover:bg-slate-50 shadow-2xs"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(1, table.getPageCount())}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 disabled:opacity-30 hover:bg-slate-50 shadow-2xs"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stock Quick-Edit Modal */}
      {quickEditProduct && (
        <StockQuickEditModal
          product={quickEditProduct}
          variants={quickEditProduct.skus.map((sku, idx) => ({
            id: `variant-${quickEditProduct.id}-${idx}`,
            size: "Standard",
            color: "Assorted",
            sku,
            stock_quantity: Math.floor(quickEditProduct.total_stock / (quickEditProduct.skus.length || 1)),
          }))}
          isOpen={Boolean(quickEditProduct)}
          onClose={() => setQuickEditProduct(null)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* CSV Import Modal (Owner only) */}
      {isOwner && (
        <CsvImportModal
          isOpen={isCsvImportOpen}
          onClose={() => setIsCsvImportOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
