import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Feather, Scissors, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export interface BrandStoryProps {
  tagline?: string;
  headline?: string;
  description?: string;
  imageUrl?: string;
  detailBadgeTitle?: string;
  detailBadgeText?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function BrandStory({
  tagline = "Artisanal Craft & Slow Fashion",
  headline = "Consciously Crafted. Designed for Everyday Grace.",
  description = "At Velaash, we reject disposable seasonal trends. Every piece is envisioned as an heirloom essential — pairing the airy breathability of authentic Indian textiles with sleek, contemporary cuts that seamlessly carry you from boardroom poise to festive soirees.",
  imageUrl = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
  detailBadgeTitle = "The Velaash Touch",
  detailBadgeText = "Hand-finished hems, concealed seams, and breathable natural textiles curated for lasting poise.",
  ctaText = "Explore The Full Catalog",
  ctaLink = "/shop",
}: BrandStoryProps) {
  return (
    <section className="py-12 sm:py-16 bg-luxury-dots border-b border-brand-border/60 overflow-hidden relative">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left: Editorial Image with Floating Badge (Reduced height on desktop) */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] lg:aspect-[6/5] max-h-[420px] lg:max-h-[460px] rounded-2xl overflow-hidden shadow-luxury border border-brand-border/80">
              <Image
                src={imageUrl}
                alt={headline}
                fill
                quality={72}
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Floating Luxury Detail Badge */}
            {detailBadgeTitle ? (
              <div className="absolute -bottom-4 right-2 sm:right-4 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-xl shadow-lg border border-brand-border/70 max-w-[230px] hidden sm:block">
                <div className="flex items-center gap-1.5 text-brand-gold text-xs font-semibold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{detailBadgeTitle}</span>
                </div>
                {detailBadgeText && (
                  <p className="text-[11px] text-brand-dark/90 font-sans leading-relaxed">
                    {detailBadgeText}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Right: Narrative Story & Pillars */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              {tagline && (
                <span className="text-brand-accent-dark text-xs font-semibold tracking-widest uppercase">
                  {tagline}
                </span>
              )}
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight leading-[1.15]">
                {headline}
              </h2>
            </div>

            <p className="text-brand-muted text-sm sm:text-base font-sans leading-relaxed">
              {description}
            </p>

            {/* 3 Pillars */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-brand-light/60 border border-brand-gold/30 flex items-center justify-center text-brand-accent shrink-0 mt-0.5">
                  <Feather className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark">
                    Pure Breathable Weaves
                  </h3>
                  <p className="text-xs text-brand-muted font-sans mt-0.5">
                    Premium Chanderi, mulmul cottons, and linen blends selected for soft, all-day comfort against your skin.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-brand-light/60 border border-brand-gold/30 flex items-center justify-center text-brand-accent shrink-0 mt-0.5">
                  <Scissors className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark">
                    Flattering Contemporary Tailoring
                  </h3>
                  <p className="text-xs text-brand-muted font-sans mt-0.5">
                    Engineered drape lines that celebrate movement without stiffness, excess bulk, or restrictive seams.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-brand-light/60 border border-brand-gold/30 flex items-center justify-center text-brand-accent shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark">
                    Delicate Hand-Touched Details
                  </h3>
                  <p className="text-xs text-brand-muted font-sans mt-0.5">
                    Subtle zari trims, artisanal button detailing, and durable French seam construction.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Proof Stat Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-brand-border/60 bg-white/80 p-3 text-center shadow-2xs">
                <span className="font-heading text-xl sm:text-2xl font-bold text-brand-dark block">100%</span>
                <span className="text-[10px] text-brand-muted font-sans font-medium uppercase tracking-wider block mt-0.5">Natural Weaves</span>
              </div>
              <div className="rounded-xl border border-brand-border/60 bg-white/80 p-3 text-center shadow-2xs">
                <span className="font-heading text-xl sm:text-2xl font-bold text-brand-dark block">500+</span>
                <span className="text-[10px] text-brand-muted font-sans font-medium uppercase tracking-wider block mt-0.5">Artisans Empowered</span>
              </div>
              <div className="rounded-xl border border-brand-border/60 bg-white/80 p-3 text-center shadow-2xs">
                <span className="font-heading text-xl sm:text-2xl font-bold text-brand-dark block">0%</span>
                <span className="text-[10px] text-brand-muted font-sans font-medium uppercase tracking-wider block mt-0.5">Synthetic Blends</span>
              </div>
            </div>

            {/* CTA & Concierge Hook */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              {ctaText && ctaLink ? (
                <Link href={ctaLink}>
                  <Button variant="primary" size="md" className="shadow-luxury hover:scale-[1.02] transition-transform">
                    <span>{ctaText}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : null}

              <div className="text-[11px] text-brand-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Need sizing help? Free guidance available via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
