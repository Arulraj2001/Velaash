"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");

    // Simulated subscription action (will connect to Resend in marketing phase)
    setTimeout(() => {
      setIsSubmitting(false);
      setStatus("success");
      setMessage("Thank you! Your 10% welcome code has been sent.");
      setEmail("");
    }, 600);
  };

  return (
    <div className="space-y-3 font-sans">
      <p className="text-brand-cream/70 text-xs leading-relaxed">
        Be the first to explore limited capsule drops, seasonal previews, and private boutique
        sales.
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative flex items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            aria-label="Email address for boutique newsletter"
            className="bg-brand-dark-muted/80 border-brand-accent/30 text-brand-cream placeholder:text-brand-cream/40 focus-visible:border-brand-gold focus-visible:ring-brand-gold h-10 w-full rounded-md border px-3.5 pr-10 text-xs focus-visible:ring-1 focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Subscribe to newsletter"
            className="text-brand-gold hover:text-brand-cream hover:bg-brand-accent/30 absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded transition-colors disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
