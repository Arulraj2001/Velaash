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
    <section className="py-16 sm:py-24 bg-brand-cream/30 border-b border-brand-border/60 overflow-hidden">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left: Editorial Image with Floating Badge */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-luxury border border-brand-border/80">
              <Image
                src={imageUrl}
                alt={headline}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Floating Luxury Detail Badge */}
            {detailBadgeTitle ? (
              <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl border border-brand-border/70 max-w-[260px] hidden sm:block">
                <div className="flex items-center gap-2 text-brand-gold text-xs font-semibold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{detailBadgeTitle}</span>
                </div>
                {detailBadgeText && (
                  <p className="text-xs text-brand-dark/90 font-sans leading-relaxed">
                    {detailBadgeText}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Right: Narrative Story & Pillars */}
          <div className="lg:col-span-6 space-y-6">
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
                  <h4 className="font-heading text-base font-semibold text-brand-dark">
                    Pure Breathable Weaves
                  </h4>
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
                  <h4 className="font-heading text-base font-semibold text-brand-dark">
                    Flattering Contemporary Tailoring
                  </h4>
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
                  <h4 className="font-heading text-base font-semibold text-brand-dark">
                    Delicate Hand-Touched Details
                  </h4>
                  <p className="text-xs text-brand-muted font-sans mt-0.5">
                    Subtle zari trims, artisanal button detailing, and durable French seam construction.
                  </p>
                </div>
              </div>
            </div>

            {ctaText && ctaLink ? (
              <div className="pt-2">
                <Link href={ctaLink}>
                  <Button variant="primary" size="md" className="shadow-luxury">
                    <span>{ctaText}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
