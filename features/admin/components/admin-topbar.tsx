"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminUserSession } from "@/features/auth/types";
import { signOutAdminAction } from "@/features/auth/actions/admin-auth.actions";
import { ExternalLink, LogOut, Shield, ShieldAlert, ChevronRight } from "lucide-react";

interface AdminTopbarProps {
  admin: AdminUserSession;
}

export function AdminTopbar({ admin }: AdminTopbarProps) {
  const pathname = usePathname();
  const isOwner = admin.role === "owner";

  // Derive title from current path
  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    if (pathname.startsWith("/admin/orders")) return "Orders Management";
    if (pathname.startsWith("/admin/products")) return "Products & Inventory";
    if (pathname.startsWith("/admin/categories")) return "Categories";
    if (pathname.startsWith("/admin/coupons")) return "Promotions & Coupons";
    if (pathname.startsWith("/admin/homepage")) return "Homepage Builder";
    if (pathname.startsWith("/admin/settings")) return "Store Settings";
    if (pathname.startsWith("/admin/staff")) return "Staff & Roles";
    return "Administrative Console";
  };

  return (
    <header className="hidden lg:flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8 shadow-2xs sticky top-0 z-20 font-sans">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/admin" className="font-medium text-slate-500 hover:text-slate-800 transition-colors">
          Admin
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900 text-sm">{getPageTitle()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 text-xs">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <span>Storefront</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </Link>

        <div className="h-5 w-px bg-slate-200" />

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold text-slate-900 leading-tight">{admin.fullName}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{admin.email}</p>
          </div>

          {isOwner ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              <Shield className="h-3 w-3" />
              Owner
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              <ShieldAlert className="h-3 w-3" />
              Staff
            </span>
          )}

          <form action={signOutAdminAction} className="ml-1">
            <button
              type="submit"
              title="Sign out of admin session"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
