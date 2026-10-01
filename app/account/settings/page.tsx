import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { Button } from "@/components/ui";
import { Settings, ArrowLeft } from "lucide-react";
import { ProfileSettingsForm } from "./profile-settings-form";

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
    <div className="rounded-2xl border border-brand-border/70 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
            Profile Settings
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage your personal profile information and contact details.
          </p>
        </div>

        <div className="p-2.5 rounded-full bg-brand-light/30 text-brand-dark">
          <Settings className="h-5 w-5 text-brand-accent" />
        </div>
      </div>

      <ProfileSettingsForm
        userEmail={user.email || ""}
        initialFullName={customer?.full_name || ""}
        initialPhone={customer?.phone || ""}
      />

      <div className="pt-2 border-t border-brand-border/40">
        <Link href="/account">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
