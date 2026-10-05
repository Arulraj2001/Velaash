"use client";

import React, { useState, useEffect } from "react";

interface WhatsAppFloatProps {
  /** Full wa.me URL e.g. https://wa.me/919876543210 */
  href: string;
  /** Display number for tooltip e.g. +91 98765 43210 */
  displayNumber?: string;
}

/**
 * Sticky floating WhatsApp CTA button.
 * - Appears after user scrolls 300px (avoids covering hero CTA)
 * - Pulses gently to attract attention
 * - Shows tooltip with number on hover/focus
 * - Hidden on /admin routes (CustomerShell already handles this,
 *   but we guard via prop — button just won't render if href is empty)
 */
export function WhatsAppFloat({ href, displayNumber }: WhatsAppFloatProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    // Check immediately in case already scrolled
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!href) return null;

  return (
    <div
      className={`fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      }`}
      aria-label="Contact us on WhatsApp"
    >
      {/* Tooltip label */}
      <div
        className={`transition-all duration-200 origin-bottom-right ${
          hovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-white border border-emerald-200 shadow-luxury rounded-xl px-3 py-2 text-right">
          <p className="text-[11px] font-semibold text-emerald-800 whitespace-nowrap">
            Chat with us
          </p>
          {displayNumber && (
            <p className="text-[10px] text-brand-muted font-mono whitespace-nowrap">
              {displayNumber}
            </p>
          )}
        </div>
        {/* Arrow */}
        <div className="w-2.5 h-2.5 bg-white border-r border-b border-emerald-200 rotate-45 ml-auto mr-5 -mt-1.5 shadow-sm" />
      </div>

      {/* Main button */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={`Chat on WhatsApp${displayNumber ? ` at ${displayNumber}` : ""}`}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />

        {/* WhatsApp SVG icon (official brand mark) */}
        <svg
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 fill-white relative z-10"
          aria-hidden="true"
        >
          <path d="M16.004 0C7.164 0 .008 7.155.008 15.996c0 2.824.74 5.474 2.032 7.774L.008 32l8.42-2.009A15.94 15.94 0 0016.004 32C24.843 32 32 24.845 32 16.004 32 7.163 24.843 0 16.004 0zm0 29.3a13.24 13.24 0 01-6.737-1.839l-.483-.285-5.002 1.192 1.238-4.869-.317-.502A13.24 13.24 0 012.706 16c0-7.334 5.966-13.3 13.298-13.3 7.332 0 13.29 5.966 13.29 13.3 0 7.335-5.958 13.3-13.29 13.3zm7.3-9.965c-.401-.2-2.373-1.17-2.741-1.304-.368-.133-.636-.2-.903.2-.268.4-1.036 1.304-1.27 1.571-.234.268-.467.3-.868.1-.4-.2-1.692-.624-3.223-1.989-1.19-1.063-1.994-2.374-2.228-2.774-.234-.4-.025-.616.175-.816.18-.179.4-.467.6-.7.2-.234.267-.4.4-.667.134-.267.067-.5-.033-.7-.1-.2-.903-2.174-1.237-2.975-.326-.78-.656-.673-.903-.686-.234-.012-.5-.015-.768-.015-.268 0-.7.1-1.068.5-.368.4-1.403 1.37-1.403 3.341 0 1.97 1.436 3.875 1.636 4.142.2.267 2.826 4.312 6.845 6.045.957.413 1.703.66 2.285.845.96.306 1.833.263 2.524.16.77-.115 2.373-.97 2.707-1.906.334-.936.334-1.737.234-1.906-.1-.168-.368-.268-.768-.467z" />
        </svg>
      </a>
    </div>
  );
}
