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
  fallbackBgImageMobile?: string;
  fallbackPositionX?: number;
  fallbackPositionY?: number;
  fallbackTextAlign?: "left" | "center" | "right";
}

export function HeroCarousel({
  slides = [],
  fallbackHeadline = "Everyday essentials for every home",
  fallbackSubtitle = "Clothing for men and women, plus traditional pooja and brass essentials.",
  fallbackCtaText = "Explore Collection",
  fallbackCtaLink = "/shop",
  fallbackSecondaryText = "Kurtas & Sets",
  fallbackSecondaryLink = "/collections/kurtas-sets",
  fallbackBgImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
  fallbackBgImageMobile = "",
  fallbackPositionX = 50,
  fallbackPositionY = 50,
  fallbackTextAlign = "center",
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
            bg_image_mobile: fallbackBgImageMobile,
            position_x: fallbackPositionX,
            position_y: fallbackPositionY,
            text_align: fallbackTextAlign,
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

  const isSlideUnoptimized = (url: string) =>
    !url.includes("images.unsplash.com") &&
    !url.includes(".supabase.co") &&
    !url.includes("res.cloudinary.com");

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
      {activeSlides.map((slide, idx) => {
        const hasMobileImage = Boolean(slide.bg_image_mobile && slide.bg_image_mobile.trim());

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
            style={{ transitionProperty: "opacity, transform" }}
          >
            {hasMobileImage ? (
              <>
                {/* Mobile View Image (< 640px) */}
                <div className="relative w-full h-full sm:hidden">
                  <Image
                    src={slide.bg_image_mobile!.trim()}
                    alt={slide.headline}
                    fill
                    priority={idx === 0}
                    unoptimized={isSlideUnoptimized(slide.bg_image_mobile!)}
                    className="object-cover object-center brightness-90 contrast-105"
                    sizes="100vw"
                  />
                </div>
                {/* Desktop View Image (>= 640px) */}
                <div className="relative w-full h-full hidden sm:block">
                  <Image
                    src={slide.bg_image.trim()}
                    alt={slide.headline}
                    fill
                    priority={idx === 0}
                    unoptimized={isSlideUnoptimized(slide.bg_image)}
                    className="object-cover object-center brightness-90 contrast-105"
                    sizes="100vw"
                  />
                </div>
              </>
            ) : (
              <Image
                src={slide.bg_image.trim()}
                alt={slide.headline}
                fill
                priority={idx === 0}
                unoptimized={isSlideUnoptimized(slide.bg_image)}
                className="object-cover object-center brightness-90 contrast-105"
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/45 to-black/30" />
            <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-[0.5px]" />
          </div>
        );
      })}

      {/* Hero Slide Content */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <Container size="lg" className="h-full relative py-14 pb-20 sm:py-20 sm:pb-24">
          {activeSlides.map((slide, idx) => {
            if (idx !== currentIndex) return null;

            const posX = typeof slide.position_x === "number" ? slide.position_x : 50;
            const posY = typeof slide.position_y === "number" ? slide.position_y : 50;
            const textAlign = slide.text_align || (posX <= 35 ? "left" : posX >= 65 ? "right" : "center");

            return (
              <div
                key={slide.id || idx}
                className={`pointer-events-auto absolute max-w-2xl w-[90%] sm:w-auto space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-500 transition-all ${
                  textAlign === "left"
                    ? "text-left items-start"
                    : textAlign === "right"
                    ? "text-right items-end"
                    : "text-center items-center"
                }`}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: `translate(-${posX}%, -${posY}%)`,
                }}
              >
                {/* Tag / Badge */}
                <div
                  className={`flex w-full ${
                    textAlign === "left"
                      ? "justify-start"
                      : textAlign === "right"
                      ? "justify-end"
                      : "justify-center"
                  }`}
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-gold/40 bg-brand-dark/60 text-brand-gold text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{slide.tag || "New Season Arrivals"}</span>
                  </div>
                </div>

                {/* Headline */}
                <h1 className="font-heading text-3xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight leading-[1.12] sm:leading-[1.08] drop-shadow-md">
                  {slide.headline}
                </h1>

                {/* Subtitle */}
                {slide.subtitle && (
                  <p
                    className={`max-w-xl text-brand-cream/90 font-sans text-xs sm:text-base md:text-lg leading-relaxed drop-shadow-xs ${
                      textAlign === "left"
                        ? "mr-auto"
                        : textAlign === "right"
                        ? "ml-auto"
                        : "mx-auto"
                    }`}
                  >
                    {slide.subtitle}
                  </p>
                )}

                {/* CTA Buttons */}
                <div
                  className={`pt-2 sm:pt-4 flex flex-row items-center gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-none ${
                    textAlign === "left"
                      ? "justify-start mr-auto"
                      : textAlign === "right"
                      ? "justify-end ml-auto"
                      : "justify-center mx-auto"
                  }`}
                >
                  <Link href={slide.cta_link || "/shop"} className="flex-1 sm:flex-initial">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto shadow-luxury hover:scale-[1.02] transition-transform text-xs sm:text-sm h-11 px-3.5 sm:px-6 whitespace-nowrap"
                    >
                      <span>{slide.cta_text || "Explore Collection"}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                    </Button>
                  </Link>

                  {slide.secondary_cta_text && slide.secondary_cta_link ? (
                    <Link href={slide.secondary_cta_link} className="flex-1 sm:flex-initial">
                      <Button
                        variant="outline"
                        size="md"
                        className="w-full sm:w-auto border-white/50 text-white hover:bg-white/15 hover:text-white backdrop-blur-xs text-xs sm:text-sm h-11 px-3.5 sm:px-6 whitespace-nowrap"
                      >
                        {slide.secondary_cta_text}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </Container>
      </div>

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
