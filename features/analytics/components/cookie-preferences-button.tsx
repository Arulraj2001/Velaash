"use client";

import React from "react";
import { Cookie } from "lucide-react";
import { openCookiePreferences } from "../utils/consent";

interface CookiePreferencesButtonProps {
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function CookiePreferencesButton({
  className = "hover:text-brand-gold transition-colors duration-150 inline-flex items-center gap-1.5",
  showIcon = false,
  label = "Cookie Preferences",
}: CookiePreferencesButtonProps) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={className}
      aria-label="Open Cookie & Analytics Preferences"
    >
      {showIcon && <Cookie className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </button>
  );
}
