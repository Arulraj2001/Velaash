import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";

export interface OccasionItem {
  id: string;
  name: string;
  subtitle: string;
  slug?: string;
  image: string;
  href: string;
}

export const DEFAULT_OCCASIONS: OccasionItem[] = [
  {
    id: "festive",
    name: "Festive Capsule",
    subtitle: "Zari, Silk Blends & Brocades",
    slug: "festive",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
    href: "/collections/kurtas-sets",
  },
  {
    id: "workwear",
    name: "Workday Grace",
    subtitle: "Clean cuts & breathable comfort",
    slug: "workwear",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
    href: "/shop?sort=newest",
  },
  {
    id: "evening",
    name: "Evening Soirées",
    subtitle: "Statement Co-Ords & Drapes",
    slug: "evening",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    href: "/collections/co-ord-sets",
  },
  {
    id: "brunch",
    name: "Casual Brunches",
    subtitle: "Airy silhouettes & subtle prints",
    slug: "brunch",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80",
    href: "/collections/dresses",
  },
];

export interface OccasionStripProps {
  title?: string;
  subtitle?: string;
  items?: OccasionItem[];
}

export function OccasionStrip({
  title = "Shop by Occasion",
  subtitle = "Thoughtfully curated palettes and cuts styled for life's special celebrations and effortless daily poise.",
  items,
}: OccasionStripProps) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_OCCASIONS;

  return (
    <section className="py-10 sm:py-14 bg-luxury-dots border-b border-brand-border/60 relative">
      <Container size="xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-semibold tracking-widest uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Styling</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-brand-dark tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-brand-muted text-xs sm:text-sm font-sans max-w-md">
            {subtitle}
          </p>
        </div>

        {/* Occasion Cards: Exact same height as category cards (~240px), full-width */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative w-full h-[220px] sm:h-[240px] lg:h-[262px] rounded-2xl overflow-hidden shadow-xs hover:shadow-luxury transition-all duration-300 border border-brand-border/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent transition-opacity duration-300 group-hover:from-brand-dark/95" />
              
              <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4.5 flex flex-col justify-end text-left">
                <span className="text-[10px] sm:text-[11px] font-sans font-medium text-brand-gold/90 uppercase tracking-wider">
                  {item.subtitle}
                </span>
                <h3 className="font-heading text-sm sm:text-base font-semibold text-white tracking-tight mt-0.5">
                  {item.name}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white group-hover:text-brand-gold transition-colors">
                  <span>Explore Edit</span>
                  <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
