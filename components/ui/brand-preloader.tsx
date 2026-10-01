"use client";

import * as React from "react";
import Image from "next/image";

interface BrandPreloaderProps {
  /** Optional custom logo image URL from store profile settings */
  logoUrl?: string | null;
  /** Force previewing the preloader regardless of sessionStorage (e.g. for testing) */
  forcePreview?: boolean;
  /** Active display duration in milliseconds before fade-out begins (default: 2800ms) */
  displayDurationMs?: number;
  /** Fade-out transition duration in milliseconds (default: 700ms) */
  fadeDurationMs?: number;
}

/**
 * BrandPreloader (Option B: Alabaster Ivory - Cinematic Luxury Edition)
 *
 * Provides a high-end cinematic splash intro for visits to Velaash.
 * Features:
 * - 2.8s active showcase + 0.7s silky curtain fade-out (3.5s total) so the emblem & animations shine.
 * - Server-rendered initial HTML + synchronous inline script to eliminate 100% of homepage flash.
 * - Precision circular medallion clipping (clipPath: circle) so the logo never shows square corners.
 * - Warm silk alabaster ivory palette with soft golden vignette.
 * - Breathing pulse and golden aura on the royal Velaash emblem.
 * - Tracked Cormorant Garamond luxury typography with shimmering accent line.
 * - Skip on tap/click or Escape key for effortless accessibility.
 * - Zero layout shift (fixed z-[99999] overlay).
 */
export function BrandPreloader({
  logoUrl,
  forcePreview = false,
  displayDurationMs = 2800,
  fadeDurationMs = 700,
}: BrandPreloaderProps) {
  const [isFadingOut, setIsFadingOut] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById("brand-preloader-root");
    // If the inline script already hid it before paint (e.g. returning session navigation),
    // cleanly unmount immediately with zero delay.
    if (el && el.style.display === "none") {
      setIsDismissed(true);
      return;
    }

    // Otherwise, the preloader is actively visible on screen!
    // Lock body scroll during cinematic intro
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    try {
      sessionStorage.setItem("velaash_preloader_seen", "true");
    } catch {
      // Ignore storage errors in private browsing modes
    }

    // Phase 1 & 2: Active showcase (2.8 seconds)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      document.body.style.overflow = originalOverflow;
    }, displayDurationMs);

    // Phase 3: Complete unmount after silky fade-out (2.8s + 0.7s = 3.5s)
    const removeTimer = setTimeout(() => {
      setIsDismissed(true);
    }, displayDurationMs + fadeDurationMs);

    // Allow user to dismiss on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFadingOut(true);
        document.body.style.overflow = originalOverflow;
        setTimeout(() => setIsDismissed(true), 300);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [displayDurationMs, fadeDurationMs]);

  // Dismiss immediately on user tap/click
  const handleDismiss = () => {
    setIsFadingOut(true);
    document.body.style.overflow = "";
    setTimeout(() => setIsDismissed(true), 300);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside
      id="brand-preloader-root"
      suppressHydrationWarning
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
      {/* Synchronous inline script to immediately hide preloader for returning session visitors before first paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var isPreview = ${forcePreview ? "true" : "new URLSearchParams(window.location.search).get('preview_intro') === 'true'"};
                var hasSeen = sessionStorage.getItem("velaash_preloader_seen");
                if (hasSeen && !isPreview) {
                  var el = document.getElementById("brand-preloader-root");
                  if (el) el.style.display = "none";
                }
              } catch (e) {}
            })();
          `,
        }}
      />

      {/* Subtle Luxury Silk Backdrop Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/30 via-transparent to-brand-border/20 pointer-events-none" />

      {/* Center Cinematic Showcase */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm mx-auto">
        {/* Glowing Royal Emblem Frame */}
        <div className="relative mb-5 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          {/* Subtle golden pulse aura behind emblem */}
          <div
            className="absolute -inset-4 rounded-full bg-brand-gold/25 blur-xl animate-pulse"
            style={{ animationDuration: "2s" }}
          />

          {/* Perfect Circular Medallion Frame */}
          <div
            className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-2 border-brand-gold/85 ring-4 ring-brand-gold/30 shadow-[0_0_35px_rgba(242,169,0,0.35)] bg-[#FAF1DF] transition-transform duration-700 ease-out hover:scale-105"
            style={{
              borderRadius: "9999px",
              clipPath: "circle(50% at 50% 50%)",
              WebkitClipPath: "circle(50% at 50% 50%)",
            }}
          >
            <Image
              src={logoUrl || "/logo.png"}
              alt="Velaash Royal Emblem"
              fill
              priority
              className="object-cover object-top scale-100 rounded-full"
              sizes="(max-width: 640px) 176px, 208px"
            />
          </div>
        </div>

        {/* Brand Name Typography */}
        <h1
          className="font-heading text-3xl sm:text-4xl tracking-[0.35em] uppercase font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6B4702] via-[#B8860B] to-[#6B4702] animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-forwards"
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
        <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-sans text-brand-muted/80 font-medium animate-in fade-in duration-700 delay-100">
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
