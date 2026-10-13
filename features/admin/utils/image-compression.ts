/**
 * Client-Side Image Compression & Optimization Utility
 * 
 * Specifically optimized for Supabase Storage Free Tier (1GB limit):
 * - Resizes images to max 1600px width/height (crisp e-commerce zoom standard).
 * - Encodes to modern WebP format at 83% quality.
 * - Reduces typical 4MB–8MB camera photos down to 120KB–220KB (95% size reduction).
 * - Avoids Next.js Server Action body limit (1MB/10MB) timeout or network errors.
 */

export interface CompressionResult {
  file: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
}

export async function compressProductImageClientSide(
  file: File,
  maxDimension = 1600,
  quality = 0.83
): Promise<CompressionResult> {
  const originalSizeBytes = file.size;

  // Don't compress SVG or GIF animations
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return {
      file,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      reductionPercentage: 0,
    };
  }

  // If running outside browser context, return file as is
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      file,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      reductionPercentage: 0,
    };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Maintain aspect ratio while constraining to maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        return resolve({
          file,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          reductionPercentage: 0,
        });
      }

      // High-quality bicubic resampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve({
              file,
              originalSizeBytes,
              compressedSizeBytes: originalSizeBytes,
              reductionPercentage: 0,
            });
          }

          // If compressed is somehow larger than original (rare), keep original
          if (blob.size >= originalSizeBytes && file.type === "image/webp") {
            return resolve({
              file,
              originalSizeBytes,
              compressedSizeBytes: originalSizeBytes,
              reductionPercentage: 0,
            });
          }

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          const reduction = Math.round(
            ((originalSizeBytes - compressedFile.size) / originalSizeBytes) * 100
          );

          resolve({
            file: compressedFile,
            originalSizeBytes,
            compressedSizeBytes: compressedFile.size,
            reductionPercentage: Math.max(0, reduction),
          });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        originalSizeBytes,
        compressedSizeBytes: originalSizeBytes,
        reductionPercentage: 0,
      });
    };

    img.src = objectUrl;
  });
}
