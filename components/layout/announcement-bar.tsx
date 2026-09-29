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
}

export function AnnouncementBar({
  text = DEFAULT_ANNOUNCEMENT.text,
  link = DEFAULT_ANNOUNCEMENT.link,
  isEnabled = true,
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

  return (
    <aside
      aria-label="Announcement"
      className="bg-brand-dark text-brand-gold border-brand-accent/20 relative z-50 border-b px-4 py-2 text-center text-xs font-medium transition-all duration-300"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 pr-6 pl-2 sm:px-8">
        <Sparkles className="text-brand-gold hidden h-3.5 w-3.5 shrink-0 sm:inline" />
        <Link
          href={link}
          className="truncate text-[11px] tracking-wider uppercase transition-all hover:underline sm:text-xs"
        >
          {text}
        </Link>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="text-brand-gold/70 hover:text-brand-gold focus-visible:ring-brand-gold absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
