"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminUserSession } from "@/features/auth/types";
import { getVisibleNavItems } from "../permissions";
import { signOutAdminAction } from "@/features/auth/actions/admin-auth.actions";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  TicketPercent,
  Sliders,
  Settings,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  ShieldAlert,
  BookOpen,
} from "lucide-react";

interface AdminSidebarProps {
  admin: AdminUserSession;
}

const ICON_MAP = {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  TicketPercent,
  Sliders,
  Settings,
  Users,
  BookOpen,
};

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getVisibleNavItems(admin.role);
  const isOwner = admin.role === "owner";

  const renderNavContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-200">
      {/* Top Brand Header */}
      <div>
        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-heading text-xl font-bold tracking-wider text-white"
            >
              <span>VELAASH</span>
              <span className="rounded bg-brand-accent/20 px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-widest text-brand-accent uppercase">
                Admin
              </span>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Close admin menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Role Indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            {isOwner ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 font-medium text-indigo-400">
                <Shield className="h-3 w-3" />
                Store Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 font-medium text-slate-300">
                <ShieldAlert className="h-3 w-3" />
                Staff Member
              </span>
            )}
          </div>
        </div>

        {/* Navigation Link List */}
        <nav className="space-y-1 px-3 py-4 font-sans text-xs">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Store Management
          </p>

          {navItems.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold shadow-xs border-l-2 border-brand-accent"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? "text-brand-accent" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>

                {item.ownerOnly && (
                  <span className="rounded bg-slate-800 border border-slate-700/80 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                    Owner
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: External Link + User Profile + Sign Out */}
      <div className="border-t border-slate-800 p-4 space-y-3 font-sans">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>View Customer Store</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="min-w-0 pr-2">
            <p className="truncate text-xs font-semibold text-white">
              {admin.fullName || "Admin User"}
            </p>
            <p className="truncate text-[11px] text-slate-400">{admin.email}</p>
          </div>

          <form action={signOutAdminAction}>
            <button
              type="submit"
              title="Sign out of administrative portal"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 text-slate-400 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Toggle Bar */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 focus:outline-none"
            aria-label="Open administrative navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" className="font-heading text-lg font-bold text-slate-900 tracking-wide">
            VELAASH <span className="font-sans text-xs font-semibold text-slate-500">ADMIN</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              Owner
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Staff
            </span>
          )}
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Off-canvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform shadow-2xl transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderNavContent()}
      </div>

      {/* Persistent Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 lg:block z-30">
        {renderNavContent()}
      </aside>
    </>
  );
}
