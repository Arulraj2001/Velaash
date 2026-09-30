"use client";

import React from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X, Check, BarChart2 } from "lucide-react";
import { useCookieConsent } from "../hooks/use-cookie-consent";

export function CookieConsentBanner() {
  const { consent, hasResponded, isMounted, isOpen, saveConsent, closePreferences } =
    useCookieConsent();

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and Privacy Preferences"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-300 sm:bottom-6 sm:right-6 sm:mx-0 sm:max-w-md"
    >
      <div className="relative rounded-2xl border border-brand-accent/25 bg-[#FFFBF0]/95 p-5 shadow-2xl backdrop-blur-md sm:p-6">
        {/* Dismiss X button if the user already made an initial choice and is just reviewing preferences */}
        {hasResponded && (
          <button
            type="button"
            onClick={closePreferences}
            className="text-brand-dark/50 hover:text-brand-dark absolute top-3.5 right-3.5 rounded-full p-1 transition-colors"
            aria-label="Close preferences"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header Badge */}
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-accent/15 text-brand-accent flex h-8 w-8 items-center justify-center rounded-full">
            <Cookie className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-brand-dark">
              Cookie & Privacy Choices
            </h3>
            {hasResponded && (
              <span className="text-[10px] tracking-wide uppercase text-brand-accent font-medium">
                Current: {consent === "all" ? "All Cookies Accepted" : "Essential Only"}
              </span>
            )}
          </div>
        </div>

        {/* Explanation text */}
        <div className="mt-3 space-y-2 text-xs text-brand-dark/80 leading-relaxed">
          <p>
            Velaash uses essential cookies to keep your shopping bag intact and secure customer
            sign-ins. We also offer optional analytics cookies to measure page performance and
            refine our garment collections.
          </p>
          <div className="rounded-xl border border-brand-accent/20 bg-brand-light/40 p-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-brand-dark font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span>Essential Cookies: Always Active (Cart, Security, Login)</span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-dark/80">
              <BarChart2 className="h-3.5 w-3.5 text-brand-accent shrink-0" />
              <span>Analytics & Attribution: Optional (Google Analytics, Meta, Clarity)</span>
            </div>
          </div>
          <p className="text-[11px] text-brand-dark/60">
            Read our transparent{" "}
            <Link
              href="/privacy-policy"
              className="text-brand-accent underline underline-offset-2 hover:text-brand-accent-deep"
            >
              Privacy Policy
            </Link>{" "}
            to see what is collected. You can adjust this anytime via the footer.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => saveConsent("essential")}
            className="w-full sm:w-auto rounded-xl border border-brand-dark/20 bg-white/80 px-4 py-2.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-light hover:border-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            {hasResponded && consent === "essential" ? (
              <span className="flex items-center justify-center gap-1">
                <Check className="h-3.5 w-3.5 text-brand-accent" /> Essential Only
              </span>
            ) : (
              "Essential Only"
            )}
          </button>
          <button
            type="button"
            onClick={() => saveConsent("all")}
            className="w-full sm:w-auto rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-accent-deep focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1"
          >
            {hasResponded && consent === "all" ? (
              <span className="flex items-center justify-center gap-1">
                <Check className="h-3.5 w-3.5" /> Accept All
              </span>
            ) : (
              "Accept All"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
