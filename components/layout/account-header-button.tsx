"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/components/auth-provider";
import { User, LogOut, Package, UserCheck, ChevronDown } from "lucide-react";

export function AccountHeaderButton() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-brand-light/30 flex h-9 w-9 animate-pulse items-center justify-center rounded-full">
        <User className="text-brand-dark/40 h-4 w-4" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/account/login"
        className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold flex items-center gap-1.5 rounded-full p-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Sign In to Patron Account"
        title="Sign In"
      >
        <User className="h-5 w-5" />
        <span className="hidden text-[11px] font-semibold tracking-wider uppercase lg:inline">
          Sign In
        </span>
      </Link>
    );
  }

  // User is logged in
  const userIdentifier = user.user_metadata?.full_name || user.email?.split("@")[0] || "Patron";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-brand-dark hover:text-brand-accent hover:bg-brand-light/40 focus-visible:ring-brand-gold border-brand-gold/40 bg-brand-light/20 flex items-center gap-1.5 rounded-full border p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-2.5 sm:py-1.5"
        aria-label="Patron Account Menu"
        aria-expanded={isOpen}
      >
        <div className="bg-brand-gold text-brand-dark flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold">
          {userIdentifier.charAt(0).toUpperCase()}
        </div>
        <span className="text-brand-dark hidden max-w-[100px] truncate text-xs font-medium lg:inline">
          {userIdentifier}
        </span>
        <ChevronDown className="text-brand-dark/60 hidden h-3 w-3 lg:inline" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="border-brand-border/80 bg-brand-card shadow-luxury animate-in fade-in-0 zoom-in-95 absolute right-0 z-50 mt-2 w-56 rounded-xl border p-2 font-sans">
          <div className="border-brand-border/60 mb-1 border-b px-3 py-2">
            <p className="text-brand-accent text-[11px] font-semibold tracking-wider uppercase">
              Signed in as
            </p>
            <p className="text-brand-dark truncate text-xs font-medium">{user.email}</p>
          </div>

          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className="text-brand-dark hover:bg-brand-light/40 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors"
          >
            <UserCheck className="text-brand-accent h-4 w-4" />
            <span>My Account</span>
          </Link>

          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className="text-brand-dark hover:bg-brand-light/40 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors"
          >
            <Package className="text-brand-accent h-4 w-4" />
            <span>My Orders</span>
          </Link>

          <div className="border-brand-border/60 my-1 border-t" />

          <button
            type="button"
            onClick={async () => {
              setIsOpen(false);
              await signOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 text-red-600" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
