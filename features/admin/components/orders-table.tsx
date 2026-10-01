"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { AdminRole } from "@/types/database.types";
import type {
  AdminOrderListItem,
  OrderStatus,
} from "../types/orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
} from "../types/orders";
import { bulkUpdateOrderStatusAction } from "../actions/order-actions";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Tag,
  X,
} from "lucide-react";

interface OrdersTableProps {
  orders: AdminOrderListItem[];
  role?: AdminRole;
  needsActionCount: number;
  initialFilter?: string;
  initialCouponCode?: string;
}

const columnHelper = createColumnHelper<AdminOrderListItem>();

export function OrdersTable({
  orders: initialOrders,
  needsActionCount,
  initialFilter = "all",
  initialCouponCode,
}: OrdersTableProps) {
  const router = useRouter();
  const [data, setData] = useState<AdminOrderListItem[]>(initialOrders);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  // needsAction is not a real TanStack column — sort it client-side in filteredData
  const [sortByNeedsAction, setSortByNeedsAction] = useState(
    initialFilter === "needs_action"
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [couponCodeFilter, setCouponCodeFilter] = useState<string | null>(
    initialCouponCode || null
  );
  const [activeTab, setActiveTab] = useState<"all" | "needs_action">(
    initialFilter === "needs_action" ? "needs_action" : "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Tab filter
      if (activeTab === "needs_action" && !item.needsAction) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Payment method
      if (paymentMethodFilter !== "all" && item.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Payment status
      if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      // Date range filter
      if (dateFrom) {
        const fromTime = new Date(dateFrom).getTime();
        const itemTime = new Date(item.createdAt).getTime();
        if (itemTime < fromTime) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        const itemTime = new Date(item.createdAt).getTime();
        if (itemTime > toDate.getTime()) return false;
      }

      // Search query (Order number, customer name, customer phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = item.orderNumber.toLowerCase().includes(q);
        const matchesName = item.customerName.toLowerCase().includes(q);
        const matchesPhone = item.customerPhone.toLowerCase().includes(q);
        if (!matchesNum && !matchesName && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [
    data,
    activeTab,
    statusFilter,
    paymentMethodFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
    searchQuery,
  ]);

  // When sortByNeedsAction is on, bubble needsAction=true rows to the top
  const displayData = useMemo(() => {
    if (!sortByNeedsAction) return filteredData;
    return [...filteredData].sort((a, b) => {
      if (a.needsAction === b.needsAction) return 0;
      return a.needsAction ? -1 : 1;
    });
  }, [filteredData, sortByNeedsAction]);

  // Bulk action handlers
  const selectedOrderNumbers = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((idx) => rowSelection[idx])
      .map((idx) => filteredData[Number(idx)]?.orderNumber)
      .filter(Boolean);
  }, [rowSelection, filteredData]);

  const handleBulkStatusUpdate = (targetStatus: OrderStatus) => {
    if (selectedOrderNumbers.length === 0) return;

    startTransition(async () => {
      setNotification(null);
      const res = await bulkUpdateOrderStatusAction(selectedOrderNumbers, targetStatus);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Successfully updated ${res.updatedCount} orders to '${ORDER_STATUS_LABELS[targetStatus]}'.${
            res.skippedCount && res.skippedCount > 0
              ? ` (${res.skippedCount} skipped due to invalid state transition)`
              : ""
          }`,
        });
        // Optimistically update local state for eligible items
        setData((prev) =>
          prev.map((ord) => {
            if (selectedOrderNumbers.includes(ord.orderNumber)) {
              return {
                ...ord,
                status: targetStatus,
                needsAction: targetStatus === "confirmed",
              };
            }
            return ord;
          })
        );
        setRowSelection({});
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to perform bulk update.",
        });
      }
    });
  };

  // Define columns
  const columns = useMemo(
    () => [
      // Checkbox for bulk actions
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Select row"
          />
        ),
      }),

      // Order Number & Needs Action Indicator
      columnHelper.accessor("orderNumber", {
        header: "Order Number",
        cell: (info) => {
          const item = info.row.original;
          return (
            <div className="flex items-center gap-2">
              {item.needsAction && (
                <span
                  title="Action Needed: Confirmed / Paid, not yet packed"
                  className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0"
                />
              )}
              <Link
                href={`/admin/orders/${item.orderNumber}`}
                className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                #{item.orderNumber}
              </Link>
            </div>
          );
        },
      }),

      // Customer Info
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: (info) => {
          const item = info.row.original;
          return (
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-slate-900 truncate max-w-[160px]">
                {item.customerName}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {item.customerPhone}
              </p>
            </div>
          );
        },
      }),

      // Item count
      columnHelper.accessor("itemCount", {
        header: "Items",
        cell: (info) => (
          <span className="text-xs text-slate-700">
            {info.getValue()} {info.getValue() === 1 ? "item" : "items"}
          </span>
        ),
      }),

      // Total Amount
      columnHelper.accessor("totalAmount", {
        header: "Total",
        cell: (info) => (
          <span className="text-xs font-semibold text-slate-900 font-mono">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),

      // Payment Method & Status
      columnHelper.accessor("paymentMethod", {
        header: "Payment",
        cell: (info) => {
          const item = info.row.original;
          const methodLabel = item.paymentMethod === "cod" ? "COD" : "Online";
          const payStyle =
            PAYMENT_STATUS_STYLES[item.paymentStatus] || PAYMENT_STATUS_STYLES.pending;

          return (
            <div className="space-y-1">
              <span className="inline-block text-[11px] font-medium text-slate-600">
                {methodLabel}
              </span>
              <div>
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${payStyle.bg} ${payStyle.text} ${payStyle.border}`}
                >
                  {item.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>
          );
        },
      }),

      // Fulfillment Status Badge
      columnHelper.accessor("status", {
        header: "Fulfillment",
        cell: (info) => {
          const status = info.getValue() as OrderStatus;
          const style = ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.pending;
          const label = ORDER_STATUS_LABELS[status] || status;

          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {label}
            </span>
          );
        },
      }),

      // Date
      columnHelper.accessor("createdAt", {
        header: "Date Placed",
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <div className="space-y-0.5">
              <p className="text-xs text-slate-700">
                {date.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {date.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );
        },
      }),

      // Quick View Action
      columnHelper.display({
        id: "actions",
        header: "Action",
        cell: (info) => (
          <Link
            href={`/admin/orders/${info.row.original.orderNumber}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            View
          </Link>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: displayData,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Top Banner Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-lg p-3 text-xs border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Coupon Filter Active Banner */}
      {couponCodeFilter && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-50/80 border border-indigo-200 px-4 py-2.5 text-xs text-indigo-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-950">Filtered by Coupon:</span>
            <span className="font-mono font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 select-all">
              {couponCodeFilter}
            </span>
            <span className="text-indigo-600">({filteredData.length} matching orders)</span>
          </div>
          <Link
            href="/admin/orders"
            onClick={() => setCouponCodeFilter(null)}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
          >
            Clear coupon filter
          </Link>
        </div>
      )}

      {/* Tabs: All Orders vs Needs Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSorting([{ id: "createdAt", desc: true }]);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-2xs font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            All Orders ({data.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("needs_action");
              setSortByNeedsAction(true);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "needs_action"
                ? "bg-blue-600 text-white shadow-2xs font-semibold"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            Needs Action ({needsActionCount})
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort:</span>
          <select
            value={sorting[0]?.id || "createdAt"}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "needsAction") {
                setSortByNeedsAction(true);
                setSorting([{ id: "createdAt", desc: true }]);
              } else if (val === "totalAmount") {
                setSortByNeedsAction(false);
                setSorting([{ id: "totalAmount", desc: true }]);
              } else if (val === "status") {
                setSortByNeedsAction(false);
                setSorting([{ id: "status", desc: false }]);
              } else {
                setSortByNeedsAction(false);
                setSorting([{ id: "createdAt", desc: true }]);
              }
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="createdAt">Newest First</option>
            <option value="needsAction">Needs Action First</option>
            <option value="totalAmount">Highest Total</option>
            <option value="status">Fulfillment Status</option>
          </select>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, phone..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none"
            />
          </div>

          {/* Fulfillment Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="all">All Fulfillment Stages</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="all">All Payment Methods</option>
              <option value="razorpay">Prepaid (Razorpay)</option>
              <option value="cod">Cash on Delivery (COD)</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Date Range Sub-row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-xs text-slate-600">
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <Filter className="h-3 w-3" />
            Date Range:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            />
          </div>
          {(dateFrom || dateTo || searchQuery || statusFilter !== "all" || paymentMethodFilter !== "all" || paymentStatusFilter !== "all" || couponCodeFilter) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSearchQuery("");
                setStatusFilter("all");
                setPaymentMethodFilter("all");
                setPaymentStatusFilter("all");
                if (couponCodeFilter) {
                  setCouponCodeFilter(null);
                  router.push("/admin/orders");
                }
              }}
              className="text-xs text-rose-600 hover:underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Coupon Filter Tag */}
        {couponCodeFilter && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Active Coupon Filter:</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
              <Tag className="h-3 w-3" />
              <span>Coupon: {couponCodeFilter}</span>
              <button
                type="button"
                onClick={() => {
                  setCouponCodeFilter(null);
                  router.push("/admin/orders");
                }}
                className="hover:text-indigo-950 p-0.5 rounded transition-colors"
                title="Remove coupon filter"
                aria-label="Remove coupon filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedOrderNumbers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedOrderNumbers.length}</span>
            <span>orders selected for bulk fulfillment update:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatusUpdate("confirmed")}
              className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              Mark as Confirmed
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatusUpdate("packed")}
              className="rounded-lg border border-indigo-300 bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
            >
              Mark as Packed
            </button>
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* TanStack Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="py-3 px-3.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Clock className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No orders found</p>
                      <p className="text-xs text-slate-400">
                        Try adjusting your search criteria, stage filters, or date range.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      row.getIsSelected() ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                filteredData.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{filteredData.length}</span>{" "}
            orders
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-xs text-slate-600 px-2">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(1, table.getPageCount())}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
