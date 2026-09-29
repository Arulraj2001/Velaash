"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function HomepageNewsletter() {
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

    // Simulated subscription handler (connected to backend newsletter API in marketing phase)
    setTimeout(() => {
      setIsSubmitting(false);
      setStatus("success");
      setMessage("Thank you for subscribing! You will receive our new arrivals and collection updates.");
      setEmail("");
    }, 600);
  };

  return (
    <div className="w-full max-w-xl mx-auto text-center font-sans">
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder="Enter your email address"
            required
            aria-label="Email address for newsletter"
            className="w-full h-12 px-4 rounded-lg bg-white/10 border border-brand-accent/40 text-brand-cream placeholder:text-brand-cream/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto h-12 px-7 rounded-lg bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-semibold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <span>Subscribe</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {status === "success" && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <p className="mt-3 text-[11px] text-brand-cream/50">
        By subscribing, you agree to receive communications from Velaash. Unsubscribe at any time.
      </p>
    </div>
  );
}
