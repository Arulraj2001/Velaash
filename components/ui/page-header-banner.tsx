import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Container } from "./container";
import { env } from "@/lib/env";

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderBannerProps {
  badge?: string;
  title: string;
  description?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  imageUrl?: string | null;
  align?: "center" | "left";
  size?: "compact" | "minimal" | "normal";
  children?: React.ReactNode;
  extraMeta?: React.ReactNode;
  className?: string;
}

export function PageHeaderBanner({
  badge,
  title,
  description,
  breadcrumbs,
  imageUrl,
  align = "center",
  size = "compact",
  children,
  extraMeta,
  className = "",
}: PageHeaderBannerProps) {
  // Build Google BreadcrumbList schema if breadcrumbs are provided
  const breadcrumbJsonLd =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: item.href ? `${BASE_URL}${item.href}` : undefined,
          })),
        }
      : null;

  const isCenter = align === "center";
  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  // Compact vertical padding when no image is present
  const paddingClass = size === "minimal" ? "py-3 sm:py-4" : "py-4 sm:py-6";

  return (
    <section
      className={`relative overflow-hidden border-b border-brand-border/70 ${
        hasImage
          ? "min-h-[140px] sm:min-h-[180px] flex items-center py-6 sm:py-8 bg-zinc-900"
          : `bg-gradient-to-b from-brand-cream-dark/30 via-brand-cream to-brand-cream/50 ${paddingClass}`
      } ${className}`}
    >
      {/* 1. If Background Image Provided from Admin: Render Letterbox Hero with Dark Overlay */}
      {hasImage && imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Refined Luxury Dark Overlay for Readability */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(242,169,0,0.15),_transparent_75%)]"
            aria-hidden="true"
          />
        </>
      )}

      {/* 2. Ambient Gold Subtle Glow (when no image) */}
      {!hasImage && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(242,169,0,0.06),_transparent_70%)]"
          aria-hidden="true"
        />
      )}

      {/* Structured Breadcrumbs Data */}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      <Container size="xl" className="relative z-10 w-full">
        <div
          className={`space-y-1.5 sm:space-y-2 ${
            isCenter ? "mx-auto max-w-3xl text-center" : "text-left"
          }`}
        >
          {/* Breadcrumb Navigation - Sleek & Compact */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumbs"
              className={`flex items-center text-[11px] sm:text-xs ${
                hasImage ? "text-white/80" : "text-brand-muted"
              } ${isCenter ? "justify-center" : "justify-start"}`}
            >
              <ol className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <li
                      key={`${item.label}-${index}`}
                      className="flex items-center gap-1 sm:gap-1.5"
                    >
                      {index > 0 && (
                        <ChevronRight
                          className={`h-3 w-3 ${
                            hasImage ? "text-brand-gold" : "text-brand-gold/60"
                          }`}
                        />
                      )}
                      {item.href && !isLast ? (
                        <Link
                          href={item.href}
                          className={`transition-colors ${
                            hasImage
                              ? "hover:text-white"
                              : "hover:text-brand-accent"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className={`font-medium ${
                            hasImage ? "text-white" : "text-brand-dark"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          {/* Eyebrow Pill Badge (Compact) */}
          {badge && (
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${
                  hasImage
                    ? "bg-black/50 border border-brand-gold/60 text-brand-gold backdrop-blur-xs"
                    : "bg-brand-light/40 border border-brand-gold/30 text-brand-accent-dark"
                }`}
              >
                <span className="text-[9px]">✦</span>
                {badge}
              </span>
            </div>
          )}

          {/* Primary Editorial Heading (Sleek 2xl-3xl, not oversized) */}
          <h1
            className={`font-heading text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl leading-snug ${
              hasImage ? "text-white drop-shadow-xs" : "text-brand-dark"
            }`}
          >
            {title}
          </h1>

          {/* Concise Single-Line or 2-line Description */}
          {description && (
            <div
              className={`text-xs sm:text-sm leading-relaxed ${
                hasImage ? "text-white/90 drop-shadow-xs" : "text-brand-muted"
              } ${isCenter ? "mx-auto max-w-xl" : "max-w-xl"}`}
            >
              {typeof description === "string" ? (
                <p className="line-clamp-2">{description}</p>
              ) : (
                description
              )}
            </div>
          )}

          {/* Extra Metadata (e.g. Item count / last updated) */}
          {extraMeta && (
            <div
              className={`text-xs ${
                hasImage ? "text-brand-gold" : "text-brand-muted"
              }`}
            >
              {extraMeta}
            </div>
          )}

          {/* Interactive Children (e.g. Quick chips, action buttons) */}
          {children && <div className="pt-1">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
