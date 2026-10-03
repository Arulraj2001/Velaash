"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  badge,
  maxWidth = "2xl",
  children,
  footer,
  className = "",
  bodyClassName = "",
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent background body scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Handle Escape key to dismiss
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = MAX_WIDTH_MAP[maxWidth] || "max-w-2xl";

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`relative w-full ${maxWidthClass} max-h-[min(90vh,calc(100dvh-2rem))] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${className}`}
      >
        {/* Pinned Sticky Header */}
        {(title || icon) && (
          <div className="flex-none flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 sm:px-6 py-3.5 sm:py-4 z-10">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {icon && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {typeof title === "string" ? (
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {title}
                    </h2>
                  ) : (
                    title
                  )}
                  {badge}
                </div>
                {description && (
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Scrollable Modal Body (overscroll-contain prevents scroll chaining) */}
        <div
          className={`flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Pinned Sticky Footer */}
        {footer && (
          <div className="flex-none border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs px-5 sm:px-6 py-3 sm:py-3.5 z-10 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
