"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { PromoPopupDisplayData } from "@/features/settings";
import { PromoPopupCard } from "./promo-popup-card";

export const PROMO_POPUP_STORAGE_KEY = "velaash_promo_popup_seen";

/**
 * Checks if the route is excluded from showing the promotional popup.
 * Excluded: /admin/*, /checkout*, /cart*, /account*
 */
export function isExcludedPromoRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith("/admin")) return true;
  if (normalized === "/checkout" || normalized.startsWith("/checkout/")) return true;
  if (normalized === "/cart" || normalized.startsWith("/cart/")) return true;
  if (normalized === "/account" || normalized.startsWith("/account/")) return true;
  return false;
}

export function PromoOfferPopup({ data }: { data: PromoPopupDisplayData | null }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isExcluded = isExcludedPromoRoute(pathname);

  useEffect(() => {
    // If no valid active data or excluded route, don't arm popup
    if (!data || !data.isEnabled || !data.coupon || isExcluded) {
      return;
    }

    // Check localStorage for today's calendar date
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
    try {
      const seenDate = localStorage.getItem(PROMO_POPUP_STORAGE_KEY);
      if (seenDate === today) {
        return;
      }
    } catch {
      // LocalStorage inaccessible (e.g. sandbox/privacy blocking)
    }

    const delayMs = Math.max(0, (data.delaySeconds ?? 9) * 1000);
    const timer = setTimeout(() => {
      setIsOpen(true);
      try {
        localStorage.setItem(PROMO_POPUP_STORAGE_KEY, today);
      } catch {}
    }, delayMs);

    return () => clearTimeout(timer);
  }, [data, isExcluded]);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !data || !data.isEnabled || !data.coupon || isExcluded) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-title"
      aria-describedby="promo-popup-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <PromoPopupCard
        containerRef={modalRef}
        closeButtonRef={closeButtonRef}
        title={data.title}
        description={data.description}
        coupon={data.coupon}
        productThumbnail={data.featuredProduct}
        onCopy={handleCopy}
        copied={copied}
        onClose={handleDismiss}
        onShopClick={handleDismiss}
        isPreview={false}
      />
    </div>
  );
}

