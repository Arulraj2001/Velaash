"use client";

import React, { useState, useTransition } from "react";
import { updateCustomerProfileAction } from "@/features/auth/actions/customer-auth.actions";
import { Button } from "@/components/ui";
import { CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";

interface ProfileSettingsFormProps {
  userEmail: string;
  initialFullName: string;
  initialPhone: string;
}

export function ProfileSettingsForm({
  userEmail,
  initialFullName,
  initialPhone,
}: ProfileSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("fullName", fullName.trim());
    formData.append("phone", phone.trim());

    startTransition(async () => {
      const res = await updateCustomerProfileAction(formData);
      if (res.success && res.message) {
        setFeedback({ type: "success", message: res.message });
      } else if (!res.success && res.error) {
        setFeedback({ type: "error", message: res.error });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="text-xs font-semibold text-brand-dark uppercase tracking-wider"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={userEmail}
          disabled
          className="mt-1.5 w-full rounded-xl border border-brand-border/80 bg-brand-cream/40 px-3.5 py-2.5 text-xs text-brand-dark font-mono cursor-not-allowed opacity-80"
        />
        <p className="text-[11px] text-brand-muted mt-1">
          Primary email associated with your account login. Contact support if you need to change your email.
        </p>
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="text-xs font-semibold text-brand-dark uppercase tracking-wider"
        >
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          className="mt-1.5 w-full rounded-xl border border-brand-border/80 bg-white px-3.5 py-2.5 text-xs text-brand-dark focus:border-brand-dark focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="text-xs font-semibold text-brand-dark uppercase tracking-wider"
        >
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit mobile number, e.g. 9876543210"
          className="mt-1.5 w-full rounded-xl border border-brand-border/80 bg-white px-3.5 py-2.5 text-xs text-brand-dark focus:border-brand-dark focus:outline-none transition-colors"
        />
        <p className="text-[11px] text-brand-muted mt-1">
          Used for delivery SMS updates and courier tracking notifications.
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
