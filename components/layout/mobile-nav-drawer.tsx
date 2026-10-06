"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ChevronDown, MessageCircle, User, ArrowRight } from "lucide-react";
import type { NavigationCategory } from "@/features/navigation";
import type { ShippingPolicySetting } from "@/features/settings";
import { groupNavigationCategories } from "@/features/navigation/utils/group-navigation";
import { BRAND, CUSTOMER_SERVICE_LINKS } from "@/lib/constants";
import { BrandWordmark } from "@/components/ui";
import { useAuth } from "@/features/auth/components/auth-provider";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NavigationCategory[];
  shippingPolicy?: ShippingPolicySetting;
  logoUrl?: string;
  storeName?: string;
  whatsappNumber?: string;
  whatsappUrl?: string;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  categories,
  logoUrl,
  storeName,
  whatsappNumber,
  whatsappUrl,
}: MobileNavDrawerProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});
  const { user, isAuthenticated } = useAuth();

  const pillars = React.useMemo(
    () => groupNavigationCategories(categories),
    [categories]
  );

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const targetNumber = (whatsappNumber || "").replace(/\D/g, "");
  const baseWaUrl = whatsappUrl || (targetNumber ? `https://wa.me/${targetNumber}` : "/contact");
  const whatsappHref = baseWaUrl === "/contact"
    ? baseWaUrl
    : `${baseWaUrl}?text=${encodeURIComponent(BRAND.whatsappMessage)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="bg-brand-dark/60 fixed inset-0 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="bg-brand-cream border-brand-border/80 animate-in slide-in-from-left relative z-10 flex h-full w-full max-w-[340px] flex-col border-r shadow-2xl duration-200">
        {/* Drawer Header */}
        <div className="border-brand-border/70 bg-brand-cream flex h-16 items-center justify-between border-b px-5">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5 font-heading text-brand-dark text-2xl font-semibold tracking-tight"
          >
            {logoUrl && (
              <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border border-brand-gold/30 bg-white/70 shadow-xs">
                <Image
                  src={logoUrl}
                  alt={storeName || BRAND.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            )}
            <BrandWordmark
              storeName={storeName || BRAND.name}
              isScrolled={true}
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="text-brand-muted hover:text-brand-dark hover:bg-brand-light/30 rounded-full p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {/* Categories Accordion */}
          <div className="space-y-1">
            <p className="text-brand-accent px-2 pb-1 text-[11px] font-semibold tracking-widest uppercase">
              Departments &amp; Collections
            </p>

            {pillars.map((pillar) => {
              if (pillar.dropdownType === "none") {
                return (
                  <div key={pillar.id} className="border-brand-border/40 border-b last:border-b-0">
                    <Link
                      href={pillar.href}
                      onClick={onClose}
                      className="text-brand-dark hover:text-brand-accent flex items-center justify-between px-2 py-3 text-sm font-semibold transition-colors"
                    >
                      <span>{pillar.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                );
              }

              const isExpanded = Boolean(expandedCategories[pillar.id]);

              return (
                <div key={pillar.id} className="border-brand-border/40 border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleCategory(pillar.id)}
                    className="text-brand-dark hover:text-brand-accent flex w-full items-center justify-between px-2 py-3 text-sm font-semibold transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <span>{pillar.name}</span>
                    <ChevronDown
                      className={`text-brand-muted h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? "text-brand-accent rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="bg-brand-light/15 mb-2 space-y-3 rounded-xl p-3">
                      <Link
                        href={pillar.href}
                        onClick={onClose}
                        className="text-brand-accent flex items-center justify-between py-1 text-xs font-bold hover:underline border-b border-brand-border/50 pb-2"
                      >
                        <span>Explore All {pillar.name}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      {pillar.sections?.map((sec) => {
                        const hasItems = sec.items && sec.items.length > 0;
                        if (!hasItems) {
                          return (
                            <Link
                              key={sec.title}
                              href={sec.href || pillar.href}
                              onClick={onClose}
                              className="flex items-center justify-between py-2 px-1 text-xs font-semibold text-slate-800 hover:text-brand-accent transition-colors border-b border-brand-border/30 last:border-b-0"
                            >
                              <span>{sec.title}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </Link>
                          );
                        }

                        return (
                          <div key={sec.title} className="space-y-1.5">
                            <Link
                              href={sec.href || pillar.href}
                              onClick={onClose}
                              className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider hover:text-brand-accent"
                            >
                              {sec.title}
                            </Link>
                            <div className="pl-2 space-y-1 border-l-2 border-brand-gold/30">
                              {sec.items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  onClick={onClose}
                                  className="text-slate-600 hover:text-brand-accent block py-0.5 text-xs transition-colors"
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Customer Care Links */}
          <div className="border-brand-border/60 space-y-2 border-t pt-2">
            <p className="text-brand-accent px-2 text-[11px] font-semibold tracking-widest uppercase">
              Client Care
            </p>
            <div className="space-y-1">
              {CUSTOMER_SERVICE_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  className="text-brand-muted hover:text-brand-accent block px-2 py-1.5 text-xs transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-brand-border/70 bg-brand-card space-y-3 border-t p-4">
          {/* Prominent WhatsApp Stylist Button */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-medium tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-800"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat with Stylist on WhatsApp</span>
          </a>

          {/* Account Status / Login */}
          <div className="pt-1">
            {isAuthenticated && user ? (
              <Link
                href="/account"
                onClick={onClose}
                className="bg-brand-light/30 text-brand-dark flex items-center justify-between rounded-lg p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <User className="text-brand-accent h-4 w-4" />
                  <span className="max-w-[180px] truncate font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <span className="text-brand-accent text-[11px] font-semibold uppercase">
                  Account →
                </span>
              </Link>
            ) : (
              <Link
                href="/account/login"
                onClick={onClose}
                className="border-brand-gold/60 text-brand-dark hover:bg-brand-light/30 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
