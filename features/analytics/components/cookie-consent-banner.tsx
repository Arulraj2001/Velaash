"use client";

import React from "react";
import Link from "next/link";
import { Cookie, X, Check } from "lucide-react";
import { useCookieConsent } from "../hooks/use-cookie-consent";

export function CookieConsentBanner() {
  const { consent, hasResponded, isMounted, isOpen, saveConsent, closePreferences } =
    useCookieConsent();

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and Privacy Preferences"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-6 sm:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="relative rounded-2xl border border-brand-gold/30 bg-[#FFFDF9]/95 p-4 shadow-[0_10px_35px_rgba(77,42,0,0.12)] backdrop-blur-md">
        {/* Dismiss X button if user has already responded and reopened preferences */}
        {hasResponded && (
          <button
            type="button"
            onClick={closePreferences}
            className="absolute top-3 right-3 rounded-full p-1 text-brand-dark/40 hover:text-brand-dark transition-colors"
            aria-label="Close preferences"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Title row with subtle icon */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold/15 text-brand-accent shrink-0">
            <Cookie className="h-3 w-3" />
          </div>
          <h3 className="font-heading text-sm font-semibold tracking-wide text-brand-dark">
            Cookie Preferences
          </h3>
        </div>

        {/* Compact 1-2 sentence notice */}
        <p className="text-[11px] leading-relaxed text-brand-dark/75">
          We use cookies to tailor your shopping experience and analyze site traffic. Learn more in our{" "}
          <Link
            href="/privacy-policy"
            className="text-brand-accent underline underline-offset-2 hover:text-brand-dark transition-colors font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>

        {/* Action Buttons: Clean, side-by-side, compact */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveConsent("essential")}
            className="flex-1 rounded-lg border border-brand-border/80 bg-white/60 px-3 py-1.5 text-center text-[11px] font-medium text-brand-dark transition-all hover:bg-brand-cream/80 hover:border-brand-dark/25 focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            {hasResponded && consent === "essential" ? (
              <span className="flex items-center justify-center gap-1">
                <Check className="h-3 w-3 text-brand-accent" /> Essential
              </span>
            ) : (
              "Essential Only"
            )}
          </button>
          <button
            type="button"
            onClick={() => saveConsent("all")}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-gold to-[#E5A000] px-3 py-1.5 text-center text-[11px] font-semibold text-brand-dark shadow-sm transition-all hover:brightness-105 focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            {hasResponded && consent === "all" ? (
              <span className="flex items-center justify-center gap-1">
                <Check className="h-3 w-3" /> Accepted
              </span>
            ) : (
              "Accept All"
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
