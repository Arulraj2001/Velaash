import React from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth";
import { Container } from "@/components/ui";
import { AccountNav, AccountMobileTabs } from "./components/account-nav";
import { User } from "lucide-react";

export const metadata: Metadata = {
  title: "My Account | Velaash",
  description: "Manage your Velaash orders, saved addresses, and clothing wishlist.",
  robots: {
    index: false,
    follow: false,
  },
};

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const authData = await getCurrentUser();

  // If user is not logged in, render children directly (e.g. for /account/login)
  // Protected pages are guarded by Next.js middleware and page-level checks.
  if (!authData || !authData.user) {
    return <>{children}</>;
  }

  const { user, customer } = authData;
  const customerName =
    customer?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Valued Customer";

  return (
    <div className="min-h-[calc(100vh-220px)] bg-brand-cream/40 py-8 sm:py-12">
      <Container size="lg">
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl border border-brand-border/70 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-light/40 border border-brand-gold/30 text-brand-dark">
                <User className="h-7 w-7 text-brand-accent" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-brand-accent">
                  Customer Account
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-medium text-brand-dark tracking-tight">
                  Hello, {customerName}
                </h1>
                <p className="text-xs text-brand-dark/70 font-mono">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="block md:hidden bg-white p-2 rounded-xl border border-brand-border/70 shadow-sm">
            <AccountMobileTabs />
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden md:block md:col-span-1 rounded-2xl border border-brand-border/70 bg-white p-4 shadow-sm sticky top-24">
              <div className="px-3 py-2 mb-2 border-b border-brand-border/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-dark/50">
                  Account Navigation
                </p>
              </div>
              <AccountNav />
            </aside>

            {/* Content Area */}
            <main className="md:col-span-3 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </Container>
    </div>
  );
}
