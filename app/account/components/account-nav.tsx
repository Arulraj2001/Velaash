"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import { signOutCustomerAction } from "@/features/auth/actions/customer-auth.actions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/account",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "My Orders",
    href: "/account/orders",
    icon: Package,
  },
  {
    name: "Addresses",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    name: "Wishlist",
    href: "/account/wishlist",
    icon: Heart,
  },
  {
    name: "Profile Settings",
    href: "/account/settings",
    icon: Settings,
    badge: "Phase 4C",
  },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 w-full">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-150",
              isActive
                ? "bg-brand-gold/15 text-brand-dark font-semibold border-l-4 border-brand-gold shadow-sm"
                : "text-brand-dark/70 hover:bg-brand-cream/80 hover:text-brand-dark border-l-4 border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-brand-dark" : "text-brand-dark/50"
                )}
              />
              <span>{item.name}</span>
            </div>

            {item.badge && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-light/60 text-brand-dark/60 tracking-wider">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      <div className="pt-4 mt-4 border-t border-brand-border/60">
        <form action={signOutCustomerAction}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </nav>
  );
}

export function AccountMobileTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-brand-border/60 no-scrollbar">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
              isActive
                ? "bg-brand-gold/20 text-brand-dark font-semibold"
                : "text-brand-dark/70 hover:bg-brand-cream/80 hover:text-brand-dark"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
