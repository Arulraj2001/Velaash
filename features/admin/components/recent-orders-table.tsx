"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { RecentOrderRow } from "../types";
import { formatCurrency, formatDateTimeIST } from "@/lib/utils";
import { ExternalLink, ShoppingBag } from "lucide-react";


interface RecentOrdersTableProps {
  orders: RecentOrderRow[];
}

const columnHelper = createColumnHelper<RecentOrderRow>();

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("orderNumber", {
        header: "Order #",
        cell: (info) => (
          <div className="font-mono text-xs font-semibold text-slate-900">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-medium text-slate-900 text-xs">{info.getValue()}</div>
              {row.customerPhone && (
                <div className="text-[11px] text-slate-500 font-mono">{row.customerPhone}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Fulfillment",
        cell: (info) => {
          const status = info.getValue();
          const badgeStyles: Record<string, string> = {
            pending: "bg-amber-50 text-amber-700 border-amber-200",
            confirmed: "bg-blue-50 text-blue-700 border-blue-200",
            packed: "bg-indigo-50 text-indigo-700 border-indigo-200",
            shipped: "bg-purple-50 text-purple-700 border-purple-200",
            out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
            delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
            cancelled: "bg-rose-50 text-rose-700 border-rose-200",
            refunded: "bg-slate-100 text-slate-700 border-slate-300",
            payment_failed: "bg-red-50 text-red-700 border-red-200",
          };

          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${
                badgeStyles[status] || "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {status.replace(/_/g, " ")}
            </span>
          );
        },
      }),
      columnHelper.accessor("paymentStatus", {
        header: "Payment",
        cell: (info) => {
          const payment = info.getValue();
          const isPaid = payment === "paid";
          const isFailed = payment === "failed";

          return (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${
                isPaid ? "text-emerald-700" : isFailed ? "text-rose-700" : "text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPaid ? "bg-emerald-500" : isFailed ? "bg-rose-500" : "bg-amber-500"
                }`}
              />
              {payment}
            </span>
          );
        },
      }),
      columnHelper.accessor("totalAmount", {
        header: () => <div className="text-right">Total</div>,
        cell: (info) => (
          <div className="text-right font-medium text-slate-900 text-xs">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => {
          const formatted = formatDateTimeIST(info.getValue());
          return <span className="text-[11px] text-slate-500">{formatted}</span>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: (info) => {
          const order = info.row.original;
          return (
            <div className="text-right">
              <Link
                href={`/admin/orders/${order.orderNumber}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
              >
                <span>View</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <ShoppingBag className="mx-auto h-8 w-8 text-slate-400" />
        <h4 className="mt-2 text-sm font-semibold text-slate-800">No recent orders</h4>
        <p className="mt-1 text-xs text-slate-500">
          When customers place orders, they will appear here in real time.
        </p>
      </div>
    );
  }

  return (
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-slate-50/60 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
