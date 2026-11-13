import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGES_BUCKET, ensureProductImagesBucket } from "./storage";

export const MAX_RAW_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB hard limit

export type ImageUploadProfile =
  | "product"
  | "category-thumb"
  | "category-banner"
  | "hero-desktop"
  | "hero-mobile"
  | "brand-logo"
  | "brand-favicon"
  | "page-banner";

export interface ProcessedImageResult {
  success: true;
  url: string;
  path: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: "webp" | "png";
  thumbnailUrl?: string;
  thumbnailPath?: string;
  thumbnailSizeBytes?: number;
}

export interface ProcessImageError {
  success: false;
  error: string;
}

export type ProcessImageOutput = ProcessedImageResult | ProcessImageError;

/**
 * Validates real file content magic bytes.
 * Rejects SVGs, GIFs, executables, HTML, and unrecognized formats.
 */
export function validateImageMagicBytes(buffer: Buffer): {
  valid: boolean;
  detectedType?: "jpeg" | "png" | "webp";
  error?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "The provided file is empty or corrupted." };
  }

  // Check for SVG (XML text)
  const headerUtf8 = buffer.subarray(0, 1024).toString("utf8").trim().toLowerCase();
  if (
    headerUtf8.includes("<svg") ||
    headerUtf8.includes("<?xml") ||
    headerUtf8.includes("<!doctype svg")
  ) {
    return {
      valid: false,
      error:
        "Vector SVG files are not supported for safety and consistency. Please upload a JPEG, PNG, or WebP photo.",
    };
  }

  // Check for GIF (GIF87a or GIF89a)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return {
      valid: false,
      error:
        "Animated GIF files are not supported. Please upload a standard photo (JPEG, PNG, or WebP).",
    };
  }

  // JPEG: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: "jpeg" };
  }

  // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedType: "png" };
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedType: "webp" };
  }

  return {
    valid: false,
    error:
      "Invalid image format. Only authentic JPEG, PNG, and WebP images are accepted.",
  };
}

/**
 * Derives the companion thumbnail storage path from a main image path.
 * e.g. "products/abc-123.webp" -> "products/abc-123-thumb.webp"
 */
export function getCompanionThumbnailPath(mainPath: string): string {
  if (mainPath.endsWith("-thumb.webp")) return mainPath;
  return mainPath.replace(/\.webp$/i, "-thumb.webp");
}

/**
 * Transforms an image buffer according to its profile using Sharp.
 * Strips EXIF metadata, auto-rotates, resizes without upscale, and compresses to target budget.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  profile: ImageUploadProfile
): Promise<{
  mainBuffer: Buffer;
  mainWidth: number;
  mainHeight: number;
  mainFormat: "webp" | "png";
  thumbBuffer?: Buffer;
  thumbWidth?: number;
  thumbHeight?: number;
}> {
  const isBrandAsset = profile === "brand-logo" || profile === "brand-favicon";
  const needsThumbnail = profile === "product" || profile === "category-thumb";

  let pipeline = sharp(inputBuffer, { failOn: "none" }).rotate(); // Auto-rotate by EXIF and strip metadata

  if (isBrandAsset) {
    // Brand assets (logo, favicon): Max 512px, keep transparency, encode as PNG for PDF & email compatibility
    pipeline = pipeline.resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    });

    const mainBuffer = await pipeline.png({ compressionLevel: 9, effort: 7 }).toBuffer();
    const meta = await sharp(mainBuffer).metadata();

    return {
      mainBuffer,
      mainWidth: meta.width || 512,
      mainHeight: meta.height || 512,
      mainFormat: "png",
    };
  }

  // Photographic Assets: Convert to WebP
  let maxWidth: number | undefined;
  let maxHeight: number | undefined;
  let targetBytesBudget: number;

  switch (profile) {
    case "product":
      // Longest side max 1600px, target < 250 KB
      maxWidth = 1600;
      maxHeight = 1600;
      targetBytesBudget = 250 * 1024;
      break;

    case "category-banner":
    case "hero-desktop":
    case "page-banner":
      // Desktop banners: max width 1920px, target < 350 KB
      maxWidth = 1920;
      maxHeight = undefined;
      targetBytesBudget = 350 * 1024;
      break;

    case "hero-mobile":
      // Mobile banner variant: max width 1080px, target < 250 KB
      maxWidth = 1080;
      maxHeight = undefined;
      targetBytesBudget = 250 * 1024;
      break;

    case "category-thumb":
      // Category thumbnail: max 512px, target < 120 KB
      maxWidth = 512;
      maxHeight = 512;
      targetBytesBudget = 120 * 1024;
      break;

    default:
      maxWidth = 1600;
      maxHeight = 1600;
      targetBytesBudget = 300 * 1024;
  }

  pipeline = pipeline.resize({
    width: maxWidth,
    height: maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  // Iterative compression starting at quality 80 down to floor of 70
  let quality = 80;
  let mainBuffer = await pipeline.clone().webp({ quality, effort: 5 }).toBuffer();

  while (mainBuffer.length > targetBytesBudget && quality > 70) {
    quality -= 5;
    mainBuffer = await pipeline.clone().webp({ quality, effort: 5 }).toBuffer();
  }

  const mainMeta = await sharp(mainBuffer).metadata();
  const mainWidth = mainMeta.width || 0;
  const mainHeight = mainMeta.height || 0;

  // Generate Companion Thumbnail (400px on longest side, WebP, target < 40 KB)
  let thumbBuffer: Buffer | undefined;
  let thumbWidth: number | undefined;
  let thumbHeight: number | undefined;

  if (needsThumbnail) {
    const thumbPipeline = sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: 400,
        height: 400,
        fit: "inside",
        withoutEnlargement: true,
      });

    let thumbQuality = 80;
    thumbBuffer = await thumbPipeline.clone().webp({ quality: thumbQuality, effort: 4 }).toBuffer();

    while (thumbBuffer.length > 40 * 1024 && thumbQuality > 70) {
      thumbQuality -= 5;
      thumbBuffer = await thumbPipeline.clone().webp({ quality: thumbQuality, effort: 4 }).toBuffer();
    }

    const thumbMeta = await sharp(thumbBuffer).metadata();
    thumbWidth = thumbMeta.width || 0;
    thumbHeight = thumbMeta.height || 0;
  }

  return {
    mainBuffer,
    mainWidth,
    mainHeight,
    mainFormat: "webp",
    thumbBuffer,
    thumbWidth,
    thumbHeight,
  };
}

/**
 * Unified Server-Side Image Upload & Processing Function.
 * Authoritative handler for all 4 admin upload routes.
 */
export async function processAndUploadImage({
  file,
  folder,
  profile,
}: {
  file: File | Blob;
  folder: "products" | "categories" | "homepage" | "brand";
  profile: ImageUploadProfile;
}): Promise<ProcessImageOutput> {
  try {
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    // 1. Raw file size check (15MB limit)
    if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `File size exceeds the 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`,
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // 2. Validate real magic bytes
    const magicCheck = validateImageMagicBytes(rawBuffer);
    if (!magicCheck.valid) {
      return {
        success: false,
        error: magicCheck.error || "Invalid file content.",
      };
    }

    // 3. Transform image with Sharp
    const transformed = await optimizeImageBuffer(rawBuffer, profile);

    // 4. Provision storage bucket & admin client
    await ensureProductImagesBucket();
    const adminClient = createAdminClient();

    const uuid = crypto.randomUUID();
    const extension = transformed.mainFormat;
    const mainStoragePath = `${folder}/${uuid}.${extension}`;
    const mainMime = extension === "webp" ? "image/webp" : "image/png";

    // 5. Upload main image with 1-year immutable cache header
    const { error: mainUploadErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(mainStoragePath, transformed.mainBuffer, {
        contentType: mainMime,
        cacheControl: "31536000, immutable",
        upsert: false,
      });

    if (mainUploadErr) {
      console.error("Storage upload failed for main image:", mainUploadErr);
      return { success: false, error: `Storage upload failed: ${mainUploadErr.message}` };
    }

    const {
      data: { publicUrl: mainUrl },
    } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(mainStoragePath);

    // 6. Upload companion thumbnail if present
    let thumbnailUrl: string | undefined;
    let thumbnailPath: string | undefined;
    let thumbnailSizeBytes: number | undefined;

    if (transformed.thumbBuffer) {
      thumbnailPath = `${folder}/${uuid}-thumb.webp`;
      thumbnailSizeBytes = transformed.thumbBuffer.length;

      const { error: thumbUploadErr } = await adminClient.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(thumbnailPath, transformed.thumbBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000, immutable",
          upsert: false,
        });

      if (thumbUploadErr) {
        console.warn("Notice: Companion thumbnail upload failed:", thumbUploadErr.message);
      } else {
        const {
          data: { publicUrl: tUrl },
        } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(thumbnailPath);
        thumbnailUrl = tUrl;
      }
    }

    return {
      success: true,
      url: mainUrl,
      path: mainStoragePath,
      sizeBytes: transformed.mainBuffer.length,
      width: transformed.mainWidth,
      height: transformed.mainHeight,
      format: transformed.mainFormat,
      thumbnailUrl,
      thumbnailPath,
      thumbnailSizeBytes,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected image processing failure.";
    console.error("[processAndUploadImage] Error:", error);
    return { success: false, error: msg };
  }
}

