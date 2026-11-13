"use client";

import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Derives a companion thumbnail URL for Supabase Storage images if available.
 * e.g. ".../products/uuid.webp" -> ".../products/uuid-thumb.webp"
 */
export function getOptimizedThumbnailUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.includes("-thumb.webp")) return imageUrl;
  if (imageUrl.includes("/product-images/") && imageUrl.endsWith(".webp")) {
    return imageUrl.replace(/\.webp$/i, "-thumb.webp");
  }
  return imageUrl;
}

interface ThumbnailImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

/**
 * Thumbnail image component with automatic companion thumbnail loading and fallback.
 * Loads the companion thumbnail (400px, < 40KB) for optimized storage images.
 * If the companion thumbnail does not exist (e.g. legacy images uploaded before this phase),
 * it seamlessly falls back to the original image URL on error without visual glitch.
 */
export function ThumbnailImage({
  src,
  alt,
  fallbackSrc,
  ...props
}: ThumbnailImageProps) {
  const originalUrl = typeof src === "string" ? src : "";
  const candidateUrl = getOptimizedThumbnailUrl(originalUrl) || originalUrl;

  const [currentSrc, setCurrentSrc] = useState<string>(candidateUrl);

  const handleError = () => {
    // If candidate thumbnail failed (e.g. 404 for legacy images), fall back to original
    if (currentSrc !== originalUrl && originalUrl) {
      setCurrentSrc(originalUrl);
    } else if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <Image
      src={currentSrc || originalUrl}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}

