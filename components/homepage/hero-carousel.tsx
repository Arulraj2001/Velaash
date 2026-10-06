"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { HeroSlide } from "@/features/admin/types/homepage";

function HeroArtDirectedImage({
  desktopSrc,
  mobileSrc,
  alt,
  className,
  priority,
  onLoad,
}: {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  className: string;
  priority: boolean;
  onLoad: () => void;
}) {
  const desktop = getImageProps({
    src: desktopSrc,
    alt,
    width: 2000,
    height: 1400,
    quality: 72,
    sizes: "100vw",
  });
  const mobile = getImageProps({
    src: mobileSrc,
    alt,
    width: 900,
    height: 1200,
    quality: 72,
    sizes: "100vw",
  });

  return (
    <picture>
      <source media="(max-width: 639px)" srcSet={mobile.props.srcSet} />
      <img
        {...desktop.props}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={onLoad}
      />
    </picture>
  );
}

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
  fallbackContentWidth?: "compact" | "balanced" | "wide" | "full";
}

export function HeroCarousel({
  slides = [],
  fallbackHeadline = "",
  fallbackSubtitle = "",
  fallbackCtaText = "",
  fallbackCtaLink = "",
  fallbackSecondaryText = "",
  fallbackSecondaryLink = "",
  fallbackBgImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
  fallbackBgImageMobile = "",
  fallbackPositionX = 50,
  fallbackPositionY = 50,
  fallbackTextAlign = "center",
  fallbackContentWidth = "balanced",
}: HeroCarouselProps) {
  // Normalize slides: use slides from database, or fallback to single slide if none provided
  const activeSlides: HeroSlide[] =
    slides.length > 0
      ? slides
      : [
          {
            id: "slide-1",
            tag: "",
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
            content_width: fallbackContentWidth,
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

  const handleHeroLoad = () => {
    window.__velaashHeroLoaded = true;
    window.dispatchEvent(new Event("velaash:hero-lcp-loaded"));
  };

  return (
    <section
      className="relative w-full min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center overflow-hidden bg-black select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured Collections Carousel"
    >
      {/* Floating Heritage Capsule Seal */}
      <div className="hidden sm:flex absolute top-6 right-6 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-[11px] font-medium text-brand-cream tracking-wide shadow-sm pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
        <span>Authentic Handloom Weaves</span>
      </div>

      {/* Background Images with smooth cross-fade & Ken Burns zoom */}
      {activeSlides.map((slide, idx) => {
        const hasMobileImage = Boolean(slide.bg_image_mobile && slide.bg_image_mobile.trim());
        const isActive = idx === currentIndex;

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <div
              className={`absolute inset-0 w-full h-full transform-gpu ${
                isActive ? "animate-hero-kenburns" : "scale-100"
              }`}
            >
              {hasMobileImage ? (
                <HeroArtDirectedImage
                  desktopSrc={slide.bg_image.trim()}
                  mobileSrc={slide.bg_image_mobile!.trim()}
                  alt={slide.headline}
                  priority={idx === 0}
                  onLoad={handleHeroLoad}
                  className="object-cover object-center brightness-95 contrast-100"
                />
              ) : (
                <Image
                  src={slide.bg_image.trim()}
                  alt={slide.headline}
                  fill
                  priority={idx === 0}
                  unoptimized={isSlideUnoptimized(slide.bg_image)}
                  onLoad={idx === 0 ? handleHeroLoad : undefined}
                  quality={72}
                  className="object-cover object-center brightness-95 contrast-100"
                  sizes="100vw"
                />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
          </div>
        );
      })}

      {/* Bottom Progress Countdown Bar */}
      {totalSlides > 1 && (
        <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-white/10 z-30 overflow-hidden pointer-events-none">
          <div
            key={currentIndex}
            className={`h-full bg-brand-gold shadow-[0_0_8px_rgba(242,169,0,0.8)] ${
              isPaused ? "" : "animate-slide-progress"
            }`}
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          />
        </div>
      )}

      {/* Hero Slide Content */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <Container size="lg" className="h-full relative py-14 pb-20 sm:py-20 sm:pb-24">
          {activeSlides.map((slide, idx) => {
            if (idx !== currentIndex) return null;

            const posX = typeof slide.position_x === "number" ? slide.position_x : 50;
            const posY = typeof slide.position_y === "number" ? slide.position_y : 50;
            const textAlign = slide.text_align || (posX <= 35 ? "left" : posX >= 65 ? "right" : "center");

            const widthClass =
              slide.content_width === "compact"
                ? "max-w-xl"
                : slide.content_width === "wide"
                ? "max-w-4xl"
                : slide.content_width === "full"
                ? "max-w-6xl"
                : "max-w-3xl";

            return (
              <div
                key={slide.id || idx}
                className={`pointer-events-auto absolute w-[94%] sm:w-full ${widthClass} flex flex-col space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-500 transition-all ${
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
                {Boolean(slide.tag && slide.tag.trim()) && (
                  <div
                    className={`flex w-full ${
                      textAlign === "left"
                        ? "justify-start"
                        : textAlign === "right"
                        ? "justify-end"
                        : "justify-center"
                    }`}
                  >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-gold/40 bg-black/60 text-brand-gold text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{slide.tag.trim()}</span>
                    </div>
                  </div>
                )}

                {/* Headline */}
                {Boolean(slide.headline && slide.headline.trim()) && (
                  <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.14] sm:leading-[1.1] drop-shadow-md whitespace-pre-line">
                    {slide.headline.trim()}
                  </h1>
                )}

                {/* Subtitle */}
                {Boolean(slide.subtitle && slide.subtitle.trim()) && (
                  <p
                    className={`max-w-2xl text-white/90 font-sans text-xs sm:text-base md:text-lg leading-relaxed drop-shadow-xs whitespace-pre-line ${
                      textAlign === "left"
                        ? "mr-auto"
                        : textAlign === "right"
                        ? "ml-auto"
                        : "mx-auto"
                    }`}
                  >
                    {slide.subtitle.trim()}
                  </p>
                )}

                {/* CTA Buttons */}
                {Boolean(
                  (slide.cta_text && slide.cta_text.trim()) ||
                    (slide.secondary_cta_text && slide.secondary_cta_text.trim())
                ) && (
                  <div
                    className={`pt-2 sm:pt-4 flex flex-row items-center gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-none ${
                      textAlign === "left"
                        ? "justify-start mr-auto"
                        : textAlign === "right"
                        ? "justify-end ml-auto"
                        : "justify-center mx-auto"
                    }`}
                  >
                    {slide.cta_text && slide.cta_text.trim() ? (
                      <Link
                        href={slide.cta_link && slide.cta_link.trim() ? slide.cta_link.trim() : "/shop"}
                        className="flex-1 sm:flex-initial"
                      >
                        <Button
                          variant="primary"
                          size="md"
                          className="w-full sm:w-auto shadow-luxury hover:scale-[1.02] transition-transform text-xs sm:text-sm h-11 px-3.5 sm:px-6 whitespace-nowrap"
                        >
                          <span>{slide.cta_text.trim()}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                        </Button>
                      </Link>
                    ) : null}

                    {slide.secondary_cta_text && slide.secondary_cta_text.trim() ? (
                      <Link
                        href={
                          slide.secondary_cta_link && slide.secondary_cta_link.trim()
                            ? slide.secondary_cta_link.trim()
                            : "/shop"
                        }
                        className="flex-1 sm:flex-initial"
                      >
                        <Button
                          variant="outline"
                          size="md"
                          className="w-full sm:w-auto border-white/50 text-white hover:bg-white/15 hover:text-white backdrop-blur-xs text-xs sm:text-sm h-11 px-3.5 sm:px-6 whitespace-nowrap"
                        >
                          {slide.secondary_cta_text.trim()}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                )}
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
        <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-2.5">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                idx === currentIndex
                  ? "w-10 bg-brand-gold shadow-[0_0_10px_rgba(242,169,0,0.7)]"
                  : "w-2.5 bg-white/35 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
