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
  // Normalize slides: if slides array is empty, generate from fallback values
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
          {
            id: "slide-2",
            tag: "Festive Capsule",
            headline: "Timeless Grace, Artisanal Craft",
            subtitle:
              "Handcrafted threadwork, rich jewel tones, and opulent fabrics tailored for your special celebrations.",
            cta_text: "Shop Festive",
            cta_link: "/collections/kurtas-sets",
            secondary_cta_text: "Dresses",
            secondary_cta_link: "/collections/dresses",
            bg_image:
              "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85",
          },
          {
            id: "slide-3",
            tag: "Contemporary Co-Ords",
            headline: "The Art of Breathable Dressing",
            subtitle:
              "Pure cottons and relaxed co-ords designed to keep you poised from morning meetings to evening dinners.",
            cta_text: "Discover Co-ords",
            cta_link: "/collections/co-ord-sets",
            secondary_cta_text: "View All",
            secondary_cta_link: "/shop",
            bg_image:
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85",
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
      className="relative w-full min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-dark select-none"
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
      <Container size="lg" className="relative z-10 py-16 text-center">
        <div
          key={currentIndex}
          className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500"
        >
          {/* Tag / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-gold/40 bg-brand-dark/60 text-brand-gold text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentSlide.tag || "New Season Arrivals"}</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight leading-[1.08] drop-shadow-md">
            {currentSlide.headline}
          </h1>

          {/* Subtitle */}
          {currentSlide.subtitle && (
            <p className="max-w-xl mx-auto text-brand-cream/90 font-sans text-sm sm:text-base md:text-lg leading-relaxed drop-shadow-xs">
              {currentSlide.subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href={currentSlide.cta_link || "/shop"} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-luxury hover:scale-[1.02] transition-transform"
              >
                <span>{currentSlide.cta_text || "Explore Collection"}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            {currentSlide.secondary_cta_text && currentSlide.secondary_cta_link ? (
              <Link href={currentSlide.secondary_cta_link} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/50 text-white hover:bg-white/15 hover:text-white backdrop-blur-xs"
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

      {/* Slide Indicators & Counter (Bottom) */}
      {totalSlides > 1 && (
        <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-4">
          {/* Numbers Counter */}
          <span className="font-heading text-xs tracking-widest text-brand-cream/80">
            0{currentIndex + 1} <span className="text-brand-cream/40">/</span> 0{totalSlides}
          </span>

          {/* Dots */}
          <div className="flex items-center gap-2">
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
        </div>
      )}
    </section>
  );
}
