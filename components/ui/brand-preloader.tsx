"use client";

import * as React from "react";
import Image from "next/image";

interface BrandPreloaderProps {
  /** Optional custom logo image URL from store profile settings */
  logoUrl?: string | null;
  /** Force previewing the preloader regardless of sessionStorage (e.g. for testing) */
  forcePreview?: boolean;
}

const emptySubscribe = () => () => {};

function getShouldShowPreloader(forcePreview: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return false;

    if (forcePreview) return true;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("preview_intro") === "true") return true;

    const hasSeen = sessionStorage.getItem("velaash_preloader_seen");
    return !hasSeen;
  } catch {
    return false;
  }
}

/**
 * BrandPreloader (Option B: Alabaster Ivory - Cinematic Luxury Edition)
 *
 * Provides a high-end cinematic splash intro for initial visits to Velaash.
 * Features:
 * - Warm silk alabaster ivory palette with soft golden vignette.
 * - Breathing pulse and golden aura on the royal Velaash emblem.
 * - Tracked Cormorant Garamond luxury typography with shimmering accent line.
 * - Smart sessionStorage gating so returning page clicks are instantaneous.
 * - Skip on tap/click or Escape key for effortless accessibility.
 * - Zero layout shift (fixed z-[99999] overlay).
 */
export function BrandPreloader({ logoUrl, forcePreview = false }: BrandPreloaderProps) {
  const shouldInitialShow = React.useSyncExternalStore(
    emptySubscribe,
    () => getShouldShowPreloader(forcePreview),
    () => false
  );

  const [isFadingOut, setIsFadingOut] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!shouldInitialShow || isDismissed) {
      return;
    }

    try {
      sessionStorage.setItem("velaash_preloader_seen", "true");
    } catch {
      // Ignore storage errors in private browsing modes
    }

    // Prevent body scroll during cinematic intro
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Cinematic timing:
    // 0.0s - 1.5s: Entrance, breathing pulse, and luxury progress line sweep
    // 1.5s: Begin silky curtain fade-out
    // 2.2s: Complete unmount
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      document.body.style.overflow = originalOverflow;
    }, 1500);

    const removeTimer = setTimeout(() => {
      setIsDismissed(true);
    }, 2200);

    // Allow user to dismiss on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFadingOut(true);
        document.body.style.overflow = originalOverflow;
        setTimeout(() => setIsDismissed(true), 400);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldInitialShow, isDismissed]);

  // Dismiss immediately on user tap/click
  const handleDismiss = () => {
    setIsFadingOut(true);
    document.body.style.overflow = "";
    setTimeout(() => setIsDismissed(true), 400);
  };

  if (!shouldInitialShow || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Velaash luxury intro"
      role="status"
      aria-live="polite"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-700 ease-out ${
        isFadingOut
          ? "opacity-0 scale-[1.02] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, #FAF6EE 55%, #F4ECE0 100%)",
      }}
    >
      {/* Subtle Luxury Silk Backdrop Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/30 via-transparent to-brand-border/20 pointer-events-none" />

      {/* Center Cinematic Showcase */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm mx-auto">
        {/* Glowing Royal Emblem */}
        <div className="relative mb-5 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
          {/* Subtle golden pulse aura behind emblem */}
          <div
            className="absolute -inset-4 rounded-full bg-brand-gold/15 blur-xl animate-pulse"
            style={{ animationDuration: "2s" }}
          />

          {/* Emblem Icon */}
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full p-2 bg-gradient-to-b from-white/90 to-brand-cream/80 border border-brand-gold/40 shadow-gold-md backdrop-blur-xs transition-transform duration-1000 ease-out hover:scale-105">
            <Image
              src={logoUrl || "/favicon.svg"}
              alt="Velaash Emblem"
              fill
              priority
              className="object-contain p-2 drop-shadow-[0_2px_8px_rgba(212,136,0,0.35)]"
            />
          </div>
        </div>

        {/* Brand Name Typography */}
        <h1
          className="font-heading text-3xl sm:text-4xl tracking-[0.35em] uppercase font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6B4702] via-[#B8860B] to-[#6B4702] animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-forwards"
          style={{ textShadow: "0 1px 2px rgba(242,169,0,0.12)" }}
        >
          VELAASH
        </h1>

        {/* Shimmer Hairline Divider */}
        <div className="relative my-3 h-[1.5px] w-28 sm:w-36 overflow-hidden rounded-full bg-brand-border/60">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold to-transparent"
            style={{
              animation: "preloaderShimmer 1.4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Tagline */}
        <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-sans text-brand-muted/80 font-medium animate-in fade-in duration-1000 delay-200">
          Contemporary Handcrafted Couture
        </p>

        {/* Subtle Tap to Skip Indicator */}
        <span className="mt-8 text-[9px] tracking-widest uppercase text-brand-subtle/50 transition-opacity duration-300">
          Tap to skip
        </span>
      </div>
    </aside>
  );
}
