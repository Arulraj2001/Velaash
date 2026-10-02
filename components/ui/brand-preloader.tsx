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
  displayDurationMs = 2000,
  fadeDurationMs = 600,
}: BrandPreloaderProps) {
  const [isFadingOut, setIsFadingOut] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById("brand-preloader-root");
    // If the inline script already hid it before paint (e.g. returning session navigation),
    // cleanly unmount immediately with zero delay.
    if (el && el.style.display === "none") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- External DOM sync: aligns React unmount state with the pre-hydration inline script's display decision.
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

    // Phase 1: Active showcase
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      document.body.style.overflow = originalOverflow;
    }, displayDurationMs);

    // Phase 2: Complete unmount after silky fade-out
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
      aria-label="Welcome to Velaash"
      role="status"
      aria-live="polite"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-700 ease-out ${
        isFadingOut
          ? "opacity-0 scale-[1.015] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, #FAF6EE 55%, #F4ECE0 100%)",
      }}
    >
      <style>{`
        @keyframes preloaderBloom {
          0% {
            opacity: 0;
            transform: scale(0.93);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes preloaderAura {
          0% {
            opacity: 0.25;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.04);
          }
          100% {
            opacity: 0.25;
            transform: scale(0.96);
          }
        }
        @keyframes preloaderFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes preloaderExpand {
          0% {
            opacity: 0;
            transform: scaleX(0);
          }
          100% {
            opacity: 1;
            transform: scaleX(1);
          }
        }
        @keyframes preloaderShimmerWave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

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
        <div
          className="relative mb-5 flex items-center justify-center"
          style={{ animation: "preloaderBloom 0.85s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          {/* Subtle golden pulse aura behind emblem */}
          <div
            className="absolute -inset-5 rounded-full bg-brand-gold/30 blur-2xl pointer-events-none"
            style={{ animation: "preloaderAura 3.2s ease-in-out infinite" }}
          />

          {/* Perfect Circular Medallion Frame */}
          <div
            className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-2 border-brand-gold/85 ring-4 ring-brand-gold/30 shadow-[0_0_35px_rgba(242,169,0,0.32)] bg-[#FAF1DF] transition-transform duration-700 ease-out hover:scale-105"
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

        {/* Welcome to Greeting */}
        <p
          className="font-heading italic text-sm sm:text-base tracking-[0.25em] text-[#A67C1E] font-normal uppercase mb-1"
          style={{
            animation: "preloaderFadeSlide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both",
          }}
        >
          Welcome to
        </p>

        {/* Brand Name Typography */}
        <h1
          className="font-heading text-3xl sm:text-4xl tracking-[0.35em] uppercase font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#5C3D00] via-[#C59B27] to-[#5C3D00]"
          style={{
            textShadow: "0 1px 3px rgba(242,169,0,0.15)",
            animation: "preloaderFadeSlide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.34s both",
          }}
        >
          VELAASH
        </h1>

        {/* Shimmer Hairline Divider */}
        <div
          className="relative my-3 h-[1.5px] w-28 sm:w-36 overflow-hidden rounded-full bg-brand-gold/30"
          style={{ animation: "preloaderExpand 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.44s both" }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent"
            style={{
              animation: "preloaderShimmerWave 1.6s ease-in-out infinite",
            }}
          />
        </div>

        {/* Tagline */}
        <p
          className="text-[10px] sm:text-[11px] tracking-[0.26em] uppercase font-sans text-brand-muted/75 font-medium"
          style={{ animation: "preloaderFadeSlide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.54s both" }}
        >
          Contemporary Handcrafted Couture
        </p>

        {/* Subtle Tap to Skip Indicator */}
        <span
          className="mt-7 text-[9px] tracking-widest uppercase text-brand-subtle/50 transition-opacity duration-300 hover:text-brand-subtle"
          style={{ animation: "preloaderFadeSlide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both" }}
        >
          Tap anywhere to enter
        </span>
      </div>
    </aside>
  );
}
