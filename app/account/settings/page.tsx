import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { Button, Badge } from "@/components/ui";
import { Settings, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile Settings | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const authData = await getCurrentUser();

  if (!authData || !authData.user) {
    redirect("/account/login?returnUrl=/account/settings");
  }

  const { user, customer } = authData;

  return (
    <div className="rounded-2xl border border-brand-border/70 bg-white p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
        <div>
          <Badge variant="subtle" size="sm" className="mb-1">
            Phase 4C Upcoming
          </Badge>
          <h2 className="font-heading text-2xl font-semibold text-brand-dark">
            Profile Settings
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage your personal profile information, communication preferences, and security.
          </p>
        </div>

        <div className="p-2.5 rounded-full bg-brand-light/30 text-brand-dark">
          <Settings className="h-5 w-5 text-brand-accent" />
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="mt-1 w-full rounded-xl border border-brand-border/80 bg-brand-cream/40 px-3.5 py-2.5 text-xs text-brand-dark font-mono cursor-not-allowed"
          />
          <p className="text-[11px] text-brand-muted mt-1">
            Primary email associated with your account login.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={customer?.full_name || ""}
            placeholder="Add your full name"
            disabled
            className="mt-1 w-full rounded-xl border border-brand-border/80 bg-brand-cream/40 px-3.5 py-2.5 text-xs text-brand-dark"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="tel"
            value={customer?.phone || ""}
            placeholder="+91 Mobile number"
            disabled
            className="mt-1 w-full rounded-xl border border-brand-border/80 bg-brand-cream/40 px-3.5 py-2.5 text-xs text-brand-dark"
          />
        </div>

        <div className="rounded-xl border border-brand-gold/40 bg-brand-light/20 p-4 text-xs text-brand-muted">
          Editable profile fields and SMS preferences will be activated in Phase 4C.
        </div>
      </div>

      <div className="pt-2">
        <Link href="/account">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
