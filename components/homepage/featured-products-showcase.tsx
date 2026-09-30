"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ProductCard, type ProductListItem } from "@/features/products";

interface FeaturedProductsShowcaseProps {
  title?: string;
  subtitle?: string;
  products: ProductListItem[];
}

export function FeaturedProductsShowcase({
  title = "Featured Arrivals",
  subtitle = "Handpicked styles from our collection.",
  products = [],
}: FeaturedProductsShowcaseProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Derive unique categories from products
  const tabs = useMemo(() => {
    const list: { id: string; label: string }[] = [
      { id: "all", label: "All Curations" },
      { id: "new", label: "✨ New Drops" },
      { id: "bestsellers", label: "🔥 Bestsellers" },
    ];

    // Add unique category tabs if products contain categories
    const categorySlugs = new Set<string>();
    products.forEach((p) => {
      if (p.category_slug && !categorySlugs.has(p.category_slug) && p.category_name) {
        categorySlugs.add(p.category_slug);
        list.push({
          id: p.category_slug,
          label: p.category_name,
        });
      }
    });

    return list.slice(0, 5); // Keep top 5 tabs clean
  }, [products]);

  // Filter products based on active tab
  const displayedProducts = useMemo(() => {
    if (activeTab === "all") return products.slice(0, 8);
    if (activeTab === "new") {
      const newItems = products.filter((p) => p.is_new);
      return newItems.length > 0 ? newItems.slice(0, 8) : [...products].reverse().slice(0, 8);
    }
    if (activeTab === "bestsellers") {
      const featured = products.filter((p) => p.is_featured);
      return featured.length > 0 ? featured.slice(0, 8) : products.slice(0, 8);
    }
    // Specific category slug
    return products.filter((p) => p.category_slug === activeTab).slice(0, 8);
  }, [products, activeTab]);

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-brand-border/60">
      <Container size="xl">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="space-y-1">
            <span className="text-brand-accent-dark text-xs font-semibold tracking-widest uppercase">
              Handpicked Styles
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-brand-muted text-xs sm:text-sm font-sans">{subtitle}</p>
            ) : null}
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-dark hover:text-brand-accent transition-colors"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-brand-dark text-white shadow-xs"
                    : "bg-brand-cream/60 text-brand-dark hover:bg-brand-cream border border-brand-border/40"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 animate-in fade-in duration-300">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-brand-cream/30 rounded-2xl border border-brand-border/60 p-8">
            <Sparkles className="w-8 h-8 text-brand-gold mx-auto mb-2" />
            <p className="text-brand-dark font-heading text-lg font-semibold">
              More styles coming soon in this collection
            </p>
            <p className="text-brand-muted text-xs mt-1">
              Explore our full catalog of contemporary silhouettes.
            </p>
            <Link href="/shop" className="mt-4 inline-block">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-brand-dark text-white text-xs font-semibold hover:bg-brand-dark/90 transition-colors"
              >
                Browse All Products
              </button>
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
