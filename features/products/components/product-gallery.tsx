"use client";

import * as React from "react";
import Image from "next/image";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImageItem } from "../types";

interface ProductGalleryProps {
  allImages: ProductImageItem[];
  selectedColor?: string | null;
  productName: string;
  isSale?: boolean;
  discountPercentage?: number | null;
  isNew?: boolean;
}

export function ProductGallery({
  allImages,
  selectedColor,
  productName,
  isSale,
  discountPercentage,
  isNew,
}: ProductGalleryProps) {
  // Filter or prioritize images corresponding to the selected color
  const galleryImages = React.useMemo(() => {
    if (!selectedColor) return allImages;

    const colorLower = selectedColor.toLowerCase();
    const matching = allImages.filter(
      (img) =>
        img.color?.toLowerCase() === colorLower || img.alt_text?.toLowerCase().includes(colorLower)
    );

    return matching.length > 0 ? matching : allImages;
  }, [allImages, selectedColor]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isHoveringZoom, setIsHoveringZoom] = React.useState(false);
  const [zoomCoords, setZoomCoords] = React.useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Reset active index if gallery images change
  const [prevGallery, setPrevGallery] = React.useState(galleryImages);
  if (prevGallery !== galleryImages) {
    setPrevGallery(galleryImages);
    setActiveIndex(0);
  }

  // Handle keyboard events for lightbox
  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, galleryImages.length]);

  // Touch swipe support for mobile
  const touchStartX = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (diff > 50) {
      // Swiped left -> next
      setActiveIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
    } else if (diff < -50) {
      // Swiped right -> prev
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
    }
    touchStartX.current = null;
  };

  // Cursor zoom calculations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomCoords({ x, y });
  };

  const currentImage = galleryImages[activeIndex] || allImages[0];

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* Main Image Stage */}
      <div
        className="group border-brand-border/70 bg-brand-light/30 relative aspect-[4/5] w-full max-h-[380px] sm:max-h-[460px] lg:max-h-[520px] mx-auto cursor-crosshair overflow-hidden rounded-2xl border shadow-xs select-none"
        onMouseEnter={() => setIsHoveringZoom(true)}
        onMouseLeave={() => setIsHoveringZoom(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Base Image */}
        {currentImage && (
          <Image
            src={currentImage.image_url}
            alt={currentImage.alt_text || `${productName} view ${activeIndex + 1}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-cover object-top transition-opacity duration-300"
          />
        )}

        {/* Desktop Cursor Lens Magnifier (2.2x Zoom) */}
        {isHoveringZoom && currentImage && (
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              backgroundImage: `url(${currentImage.image_url})`,
              backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
              backgroundSize: "230%",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}

        {/* Badges: Sale & New */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5">
          {isSale && discountPercentage && (
            <span className="bg-brand-rose rounded-full px-3 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-xs">
              {discountPercentage}% OFF
            </span>
          )}
          {isNew && !isSale && (
            <span className="bg-brand-gold text-brand-dark rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-xs">
              NEW
            </span>
          )}
        </div>

        {/* Lightbox Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="text-brand-dark absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-xs transition-transform hover:scale-105 hover:bg-white focus:outline-none"
          aria-label="Enlarge image in fullscreen lightbox"
          title="Click to zoom"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Mobile Swipe Guidance Arrows */}
        {galleryImages.length > 1 && (
          <div className="pointer-events-none absolute inset-x-2 inset-y-0 flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
              }}
              className="text-brand-dark pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/70 shadow-xs backdrop-blur-xs"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
              }}
              className="text-brand-dark pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/70 shadow-xs backdrop-blur-xs"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Dot Indicators */}
      {galleryImages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 md:hidden">
          {galleryImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex
                  ? "bg-brand-dark w-6"
                  : "bg-brand-border hover:bg-brand-dark/40 w-2"
              }`}
              aria-label={`View image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Desktop Thumbnail Strip */}
      {galleryImages.length > 1 && (
        <div className="hidden flex-wrap items-center gap-2.5 md:flex">
          {galleryImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`bg-brand-light/40 relative h-18 w-14 sm:h-20 sm:w-16 shrink-0 overflow-hidden rounded-xl border transition-all ${
                idx === activeIndex
                  ? "border-brand-gold ring-brand-gold/60 scale-105 shadow-xs ring-2 ring-offset-1"
                  : "border-brand-border/80 hover:border-brand-dark/40 opacity-75 hover:opacity-100"
              }`}
              aria-label={`Select product image ${idx + 1}`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md duration-200 sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            aria-label="Close fullscreen view"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Controls */}
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                }
                className="absolute top-1/2 left-4 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 sm:left-8"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
                }
                className="absolute top-1/2 right-4 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 sm:right-8"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Lightbox Center Image */}
          <div className="relative h-[85vh] w-full max-w-4xl select-none">
            <Image
              src={currentImage.image_url}
              alt={currentImage.alt_text || `${productName} enlarged view`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Bottom indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 font-mono text-xs text-white/90 backdrop-blur-xs">
            {activeIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
