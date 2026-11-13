/**
 * Browser-side Image Pre-Compressor
 *
 * Resizes and compresses images in the admin browser before uploading to server actions.
 * Reduces network payload from 5-15MB down to ~150-400KB, eliminating Netlify payload limit
 * errors and timeout issues. The server-side Sharp step remains the final authority.
 */

export interface BrowserCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.8)
  format?: "webp" | "png" | "jpeg";
}

/**
 * Resizes and compresses an image File in the browser using HTMLCanvasElement.
 * Includes Safari fallback: if Safari returns a PNG instead of WebP, falls back to JPEG.
 */
export async function precompressImageInBrowser(
  file: File,
  options: BrowserCompressionOptions = {}
): Promise<File> {
  // If not running in browser environment or file is not an image, pass through to server
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Pass SVGs directly to server so authoritative server validation provides rejection
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = "webp",
  } = options;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-preserving dimensions without enlargement
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback to original
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        if (format === "png") {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const baseName = file.name.replace(/\.[^/.]+$/, "");
              const compressedFile = new File([blob], `${baseName}.png`, {
                type: "image/png",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/png"
          );
          return;
        }

        // Target: WebP
        canvas.toBlob(
          (webpBlob) => {
            if (!webpBlob) {
              resolve(file);
              return;
            }

            // Safari Check: Some Safari versions do not support canvas WebP encoding
            // and silently return image/png. If so, fall back to JPEG instead of heavy PNG.
            if (webpBlob.type !== "image/webp") {
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) {
                    resolve(file);
                    return;
                  }
                  const baseName = file.name.replace(/\.[^/.]+$/, "");
                  const jpegFile = new File([jpegBlob], `${baseName}.jpg`, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(jpegFile);
                },
                "image/jpeg",
                Math.max(0.75, quality)
              );
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const webpFile = new File([webpBlob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      } catch (err) {
        console.warn("Browser pre-compression error, falling back to original file:", err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to raw file for server-side handling
    };

    img.src = objectUrl;
  });
}

