"use client";

import * as React from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { DEFAULT_ANNOUNCEMENT } from "@/lib/constants";

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

interface AnnouncementBarProps {
  text?: string;
  link?: string;
  isEnabled?: boolean;
  speed?: number;
}

export function AnnouncementBar({
  text = DEFAULT_ANNOUNCEMENT.text,
  link = DEFAULT_ANNOUNCEMENT.link,
  isEnabled = true,
  speed = 28,
}: AnnouncementBarProps) {
  const isServerOrDismissed = React.useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem("velaash_announcement_dismissed") === "true",
    () => true
  );
  const [localDismissed, setLocalDismissed] = React.useState(false);

  const isDismissed = isServerOrDismissed || localDismissed;

  const handleDismiss = () => {
    setLocalDismissed(true);
    try {
      sessionStorage.setItem("velaash_announcement_dismissed", "true");
    } catch {
      // safe fallback if storage is restricted
    }
  };

  if (!isEnabled || isDismissed) {
    return null;
  }

  const content = (
    <div className="flex items-center gap-2">
      <Sparkles className="text-brand-gold h-3.5 w-3.5 shrink-0 animate-pulse" />
      <span className="text-[11px] font-semibold tracking-widest uppercase sm:text-xs">
        {text}
      </span>
    </div>
  );

  return (
    <aside
      aria-label="Announcement"
      className="bg-brand-dark text-brand-gold border-brand-accent/30 relative z-50 overflow-hidden border-b py-2 text-xs font-medium transition-all duration-300 select-none group"
    >
      {/* Subtle Golden Shimmer Bottom Border Highlight */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />

      {/* Moving Marquee Ticker Track */}
      <div className="flex overflow-hidden">
        <div
          style={{ animationDuration: `${speed}s` }}
          className="animate-announcement-marquee flex shrink-0 items-center gap-8 pr-8"
        >
          {[0, 1, 2, 3].map((idx) => (
            <div key={`track1-${idx}`} className="flex items-center gap-8">
              {link ? (
                <Link
                  href={link}
                  className="flex items-center hover:text-white transition-colors duration-200"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
              <span className="text-brand-gold/40 text-[10px]">✦</span>
            </div>
          ))}
        </div>

        {/* Duplicate track for seamless infinite looping */}
        <div
          aria-hidden="true"
          style={{ animationDuration: `${speed}s` }}
          className="animate-announcement-marquee flex shrink-0 items-center gap-8 pr-8"
        >
          {[0, 1, 2, 3].map((idx) => (
            <div key={`track2-${idx}`} className="flex items-center gap-8">
              {link ? (
                <Link
                  href={link}
                  tabIndex={-1}
                  className="flex items-center hover:text-white transition-colors duration-200"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
              <span className="text-brand-gold/40 text-[10px]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Gradient Fade Mask & Dismiss Button */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-brand-dark via-brand-dark/90 to-transparent pl-8 pr-3">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="pointer-events-auto text-brand-gold/70 hover:text-brand-gold hover:bg-brand-gold/10 focus-visible:ring-brand-gold rounded p-1 transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
