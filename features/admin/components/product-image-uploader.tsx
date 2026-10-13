"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import type { AdminProductImageFormItem } from "../types/products";
import { uploadProductImageAction } from "../actions/upload-actions";
import { getMediaGalleryDataAction, type MediaItem } from "../actions/media-actions";
import { compressProductImageClientSide } from "../utils/image-compression";
import {
  UploadCloud,
  Link2,
  Plus,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  ImageIcon,
  Check,
  Search,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface ProductImageUploaderProps {
  images: AdminProductImageFormItem[];
  onChange: (images: AdminProductImageFormItem[]) => void;
  onTrackDeletedUrl?: (url: string) => void;
  productName?: string;
}

/**
 * Extracts a human-friendly alt text string from a URL filename or fallback product name
 */
function generateAltTextFromUrl(url: string, index: number, fallbackName?: string): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").filter(Boolean).pop() || "";
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const cleaned = nameWithoutExt.replace(/[-_]+/g, " ").trim();

    // Avoid using raw UUIDs or hashes as alt text
    if (cleaned.length >= 3 && !/^[0-9a-f-]{10,}$/i.test(cleaned)) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  } catch {
    // URL parse exception fallback
  }

  const base = fallbackName?.trim() || "Product";
  return `${base} image ${index + 1}`;
}

export function ProductImageUploader({
  images,
  onChange,
  onTrackDeletedUrl,
  productName,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab mode state: "upload" (file picker), "url" (pasting URLs), or "gallery" (storage library)
  const [inputMode, setInputMode] = useState<"upload" | "url" | "gallery">("upload");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Storage Gallery state
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");

  const loadGallery = async () => {
    setIsGalleryLoading(true);
    try {
      const res = await getMediaGalleryDataAction();
      if (res.success && res.data) {
        setGalleryItems(res.data.items);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsGalleryLoading(false);
    }
  };

  // URL state
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Count parsed URLs for button label
  const parsedUrlCount = React.useMemo(() => {
    return urlInput
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter(Boolean).length;
  }, [urlInput]);

  // File upload handler with automatic client-side WebP compression
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Client-side file validation
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (!allowed.includes(file.type)) {
          setUploadError(`"${file.name}" is not a valid format. Please upload JPG, PNG, or WebP.`);
          continue;
        }

        // Allow selection up to 15MB since client-side compression will optimize it down to ~150KB
        if (file.size > 15 * 1024 * 1024) {
          setUploadError(`"${file.name}" exceeds the 15MB size limit.`);
          continue;
        }

        setUploadStatus(`Optimizing "${file.name}" for crystal-clear resolution...`);

        // 2. High-quality client-side compression (resizes to max 1600px & encodes to WebP @ 83%)
        const { file: compressedFile, reductionPercentage } =
          await compressProductImageClientSide(file, 1600, 0.83);

        setUploadStatus(
          reductionPercentage > 0
            ? `Uploading (${reductionPercentage}% compressed)...`
            : "Uploading to storage..."
        );

        // 3. Upload compressed WebP via server action
        const formData = new FormData();
        formData.append("file", compressedFile);

        const res = await uploadProductImageAction(formData);
        if (!res.success || !res.url) {
          setUploadError(res.error || `Failed to upload "${file.name}".`);
          continue;
        }

        const isFirst = newImages.length === 0;
        newImages.push({
          image_url: res.url,
          alt_text: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          is_primary: isFirst,
          display_order: newImages.length,
        });
      }

      onChange(newImages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      if (
        msg.includes("unexpected response") ||
        msg.includes("UNAUTHORIZED") ||
        msg.includes("redirect")
      ) {
        setUploadError(
          "Your admin session may have expired. Please refresh the page or sign in again to continue."
        );
      } else {
        setUploadError(msg);
      }
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // URL submission handler (Single & Bulk)
  const handleAddUrls = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUrlError(null);

    const lines = urlInput
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setUrlError("Please enter at least one image URL.");
      return;
    }

    const validUrls: string[] = [];
    const invalidEntries: string[] = [];

    for (const raw of lines) {
      let candidate = raw;
      if (!/^https?:\/\//i.test(candidate)) {
        candidate = `https://${candidate}`;
      }

      try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          validUrls.push(parsed.href);
        } else {
          invalidEntries.push(raw);
        }
      } catch {
        invalidEntries.push(raw);
      }
    }

    if (invalidEntries.length > 0) {
      setUrlError(
        `Invalid URL format detected: ${invalidEntries.slice(0, 2).join(", ")}${
          invalidEntries.length > 2 ? ` (+${invalidEntries.length - 2} more)` : ""
        }. Please ensure entries start with http:// or https://.`
      );
      return;
    }

    // Deduplicate against existing gallery images
    const existingSet = new Set(images.map((img) => img.image_url));
    const uniqueBatch = Array.from(new Set(validUrls)).filter((u) => !existingSet.has(u));

    if (uniqueBatch.length === 0) {
      setUrlError("All entered URLs are already present in the product gallery.");
      return;
    }

    const updatedImages: AdminProductImageFormItem[] = [...images];
    const startIndex = updatedImages.length;

    uniqueBatch.forEach((url, idx) => {
      const isFirst = updatedImages.length === 0 && idx === 0;
      updatedImages.push({
        image_url: url,
        alt_text: generateAltTextFromUrl(url, startIndex + idx, productName),
        is_primary: isFirst,
        display_order: updatedImages.length,
      });
    });

    onChange(updatedImages);
    setUrlInput("");
    setUrlError(null);
  };

  const handleRemove = (index: number) => {
    const item = images[index];
    if (item?.image_url && onTrackDeletedUrl) {
      onTrackDeletedUrl(item.image_url);
    }

    const updated = images.filter((_, i) => i !== index);
    // If we removed the primary image, make the first remaining image primary
    if (item.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    // Re-index display orders
    updated.forEach((img, i) => {
      img.display_order = i;
    });

    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  };

  const handleAltTextChange = (index: number, alt: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], alt_text: alt };
    onChange(updated);
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    updated.forEach((img, i) => {
      img.display_order = i;
    });

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Input Mode Selector (Tabs) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              inputMode === "upload"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload & Compress</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode("gallery");
              loadGallery();
            }}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              inputMode === "gallery"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Storage Gallery</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("url")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              inputMode === "url"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Image URLs (Single or Bulk)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {images.length} {images.length === 1 ? "image" : "images"} attached
        </span>
      </div>

      {/* Mode A: File Upload Zone */}
      {inputMode === "upload" && (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:border-indigo-400 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                <p className="text-xs font-semibold text-slate-800">
                  {uploadStatus || "Uploading image to storage..."}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  Auto-compressing to 1600px WebP to preserve free tier storage
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-600 group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Click to upload images <span className="text-slate-400">or drag &amp; drop</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    JPG, PNG, or WebP up to 15MB &bull; Auto-optimized to crisp WebP &bull; Multi-file supported
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Pick from Storage Gallery */}
      {inputMode === "gallery" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                Select from Storage Gallery
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reuse images previously uploaded to Supabase Storage without uploading again.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="Filter by name..."
                  className="rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={loadGallery}
                disabled={isGalleryLoading}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Refresh gallery"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGalleryLoading ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>
          </div>

          {isGalleryLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Scanning storage files...</span>
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              No images found in storage. Upload some images first!
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
              {galleryItems
                .filter((item) =>
                  item.name.toLowerCase().includes(gallerySearch.toLowerCase())
                )
                .map((item) => {
                  const isAttached = images.some((img) => img.image_url === item.publicUrl);
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        if (isAttached) {
                          onChange(images.filter((img) => img.image_url !== item.publicUrl));
                        } else {
                          const isFirst = images.length === 0;
                          onChange([
                            ...images,
                            {
                              image_url: item.publicUrl,
                              alt_text: generateAltTextFromUrl(item.publicUrl, images.length, productName),
                              is_primary: isFirst,
                              display_order: images.length,
                            },
                          ]);
                        }
                      }}
                      className={`group relative aspect-square rounded-md overflow-hidden border transition-all ${
                        isAttached
                          ? "border-indigo-600 ring-2 ring-indigo-600/30"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <Image
                        src={item.publicUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isAttached && (
                        <div className="absolute inset-0 bg-indigo-900/30 flex items-center justify-center">
                          <div className="rounded-full bg-indigo-600 text-white p-1 shadow-xs">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-left">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Mode B: Add Image URLs (Single or Bulk) */}
      {inputMode === "url" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <label htmlFor="bulk-image-urls" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-indigo-600" />
                Paste Image URLs (Single or Multiple)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Paste one URL per line or separate multiple URLs with commas. Direct HTTPS links from CDNs, Unsplash, Shopify, etc. are supported.
              </p>
            </div>
          </div>

          <textarea
            id="bulk-image-urls"
            rows={4}
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (urlError) setUrlError(null);
            }}
            placeholder={`https://images.unsplash.com/photo-1610030469983-98e550d6193c\nhttps://cdn.example.com/products/saree-pallu.jpg\nhttps://cdn.example.com/products/saree-closeup.webp`}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />

          {urlError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              {parsedUrlCount > 0 ? (
                <span className="font-medium text-slate-700">
                  {parsedUrlCount} {parsedUrlCount === 1 ? "URL" : "URLs"} ready to add
                </span>
              ) : (
                "You can add multiple images in one click"
              )}
            </span>

            <div className="flex items-center gap-2">
              {urlInput.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput("");
                    setUrlError(null);
                  }}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAddUrls()}
                disabled={parsedUrlCount === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>
                  {parsedUrlCount > 1
                    ? `Add ${parsedUrlCount} Images to Gallery`
                    : "Add Image to Gallery"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Images Gallery Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Product Gallery ({images.length} images)</span>
            <span className="text-[11px]">Alt text required for every image</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, idx) => {
              const isMissingAlt = !img.alt_text || img.alt_text.trim().length === 0;
              const isSupabaseStorage = img.image_url.includes("/product-images/");

              return (
                <div
                  key={img.image_url || idx}
                  className={`group relative flex flex-col rounded-xl border bg-white p-3 shadow-2xs transition-shadow ${
                    img.is_primary
                      ? "border-indigo-500 ring-2 ring-indigo-500/10"
                      : isMissingAlt
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200"
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || "Product image"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 300px"
                      unoptimized={!img.image_url.startsWith("https://")}
                    />

                    {/* Primary Badge */}
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs z-10">
                        <Star className="h-3 w-3 fill-white" />
                        Primary
                      </span>
                    )}

                    {/* Source Pill (Storage vs External URL) */}
                    <span
                      className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-md z-10 ${
                        isSupabaseStorage
                          ? "bg-slate-900/60 text-slate-100"
                          : "bg-blue-900/65 text-blue-100"
                      }`}
                    >
                      {isSupabaseStorage ? (
                        <>
                          <ImageIcon className="h-2.5 w-2.5" />
                          Storage
                        </>
                      ) : (
                        <>
                          <Link2 className="h-2.5 w-2.5" />
                          URL
                        </>
                      )}
                    </span>

                    {/* Reorder and Delete controls */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="rounded-md bg-black/60 p-1 text-white hover:bg-rose-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Move Left / Right buttons */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "left")}
                        className="rounded bg-black/70 p-1 text-white disabled:opacity-30 hover:bg-black transition-colors"
                        title="Move earlier"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMove(idx, "right")}
                        className="rounded bg-black/70 p-1 text-white disabled:opacity-30 hover:bg-black transition-colors"
                        title="Move later"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Image Details / Alt text */}
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Alt Text <span className="text-rose-500">*</span>
                        </label>
                        {!img.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        value={img.alt_text}
                        onChange={(e) => handleAltTextChange(idx, e.target.value)}
                        placeholder="e.g. Model wearing peach chanderi silk kurta front view"
                        className={`mt-1 w-full rounded-md border px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                          isMissingAlt
                            ? "border-amber-400 focus:border-amber-500"
                            : "border-slate-200 focus:border-indigo-500"
                        }`}
                      />

                      {isMissingAlt && (
                        <p className="mt-0.5 text-[10px] text-amber-700 font-medium">
                          Alt text required for SEO and accessibility
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
