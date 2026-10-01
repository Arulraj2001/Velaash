"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { HeroSlide } from "@/features/admin/types/homepage";

interface HeroCarouselProps {
  slides?: HeroSlide[];
  fallbackHeadline?: string;
  fallbackSubtitle?: string;
  fallbackCtaText?: string;
  fallbackCtaLink?: string;
  fallbackSecondaryText?: string;
  fallbackSecondaryLink?: string;
  fallbackBgImage?: string;
}

export function HeroCarousel({
  slides = [],
  fallbackHeadline = "Modern Everyday Luxury",
  fallbackSubtitle = "Effortless silhouettes, refined textures, and contemporary wardrobe essentials designed for everyday elegance.",
  fallbackCtaText = "Explore Collection",
  fallbackCtaLink = "/shop",
  fallbackSecondaryText = "Kurtas & Sets",
  fallbackSecondaryLink = "/collections/kurtas-sets",
  fallbackBgImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
}: HeroCarouselProps) {
  // Normalize slides: use slides from database, or fallback to single slide if none provided
  const activeSlides: HeroSlide[] =
    slides.length > 0
      ? slides
      : [
          {
            id: "slide-1",
            tag: "New Season Arrivals",
            headline: fallbackHeadline,
            subtitle: fallbackSubtitle,
            cta_text: fallbackCtaText,
            cta_link: fallbackCtaLink,
            secondary_cta_text: fallbackSecondaryText,
            secondary_cta_link: fallbackSecondaryLink,
            bg_image: fallbackBgImage,
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = activeSlides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play interval
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(nextSlide, 6500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  return (
    <section
      className="relative w-full min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center overflow-hidden bg-brand-dark select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured Collections Carousel"
    >
      {/* Background Images with smooth cross-fade */}
      {activeSlides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
          style={{ transitionProperty: "opacity, transform" }}
        >
          <Image
            src={slide.bg_image}
            alt={slide.headline}
            fill
            priority={idx === 0}
            className="object-cover object-center brightness-90 contrast-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/45 to-black/30" />
          <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-[0.5px]" />
        </div>
      ))}

      {/* Hero Slide Content */}
      <Container size="lg" className="relative z-10 py-16 pb-20 sm:py-24 sm:pb-24 text-center">
        <div
          key={currentIndex}
          className="max-w-3xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-500"
        >
          {/* Tag / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-gold/40 bg-brand-dark/60 text-brand-gold text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentSlide.tag || "New Season Arrivals"}</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-3xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight leading-[1.12] sm:leading-[1.08] drop-shadow-md">
            {currentSlide.headline}
          </h1>

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className="max-w-xl mx-auto text-brand-cream/90 font-sans text-xs sm:text-base md:text-lg leading-relaxed drop-shadow-xs">
              {currentSlide.subtitle}
            </p>
          )}

          {/* CTA Buttons: Left and Right Medium Buttons in a Single Line on Mobile */}
          <div className="pt-2 sm:pt-4 flex flex-row items-center justify-center gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-none mx-auto">
            <Link href={currentSlide.cta_link || "/shop"} className="flex-1 sm:flex-initial">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto shadow-luxury hover:scale-[1.02] transition-transform text-xs sm:text-sm h-11 px-3.5 sm:px-6 whitespace-nowrap"
              >
                <span>{currentSlide.cta_text || "Explore Collection"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
              </Button>
            </Link>

            {currentSlide.secondary_cta_text && currentSlide.secondary_cta_link ? (
              <Link href={currentSlide.secondary_cta_link} className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto border-white/50 text-white hover:bg-white/15 hover:text-white backdrop-blur-xs text-xs sm:text-sm h-11 px-3.5 sm:px-6 whitespace-nowrap"
                >
                  {currentSlide.secondary_cta_text}
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Container>

      {/* Slide Navigation Arrows (Desktop) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center bg-black/30 hover:bg-black/60 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center bg-black/30 hover:bg-black/60 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Slide Indicators (Bottom) */}
      {totalSlides > 1 && (
        <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-8 bg-brand-gold shadow-xs"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
