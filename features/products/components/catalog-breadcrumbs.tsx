import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CatalogBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function CatalogBreadcrumbs({ items }: CatalogBreadcrumbsProps) {
  // Build Google BreadcrumbList schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `https://velaash.com${item.href}` : undefined,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visual Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="text-brand-dark/60 py-2 font-sans text-xs">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="text-brand-dark/40 h-3 w-3" />}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-brand-accent transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-brand-dark font-medium">{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
