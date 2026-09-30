"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import type { AdminProductImageFormItem } from "../types/products";
import { uploadProductImageAction } from "../actions/upload-actions";
import {
  UploadCloud,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";


interface ProductImageUploaderProps {
  images: AdminProductImageFormItem[];
  onChange: (images: AdminProductImageFormItem[]) => void;
  onTrackDeletedUrl?: (url: string) => void;
}

export function ProductImageUploader({
  images,
  onChange,
  onTrackDeletedUrl,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Client-side file validation
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
          setUploadError(`"${file.name}" is not a valid format. Please upload JPG, PNG, or WebP.`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`"${file.name}" exceeds the 5MB size limit.`);
          continue;
        }

        // 2. Upload via server action
        const formData = new FormData();
        formData.append("file", file);

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
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
      {/* Upload Zone */}
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
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold text-slate-800">Uploading image to storage...</p>
            <p className="text-[11px] text-slate-500">Validating format and storage limits</p>
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
                JPG, PNG, or WebP &bull; Maximum 5MB per image &bull; High resolution apparel photography
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Product Gallery ({images.length} uploaded)</span>
            <span className="text-[11px]">Alt text required for every image</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, idx) => {
              const isMissingAlt = !img.alt_text || img.alt_text.trim().length === 0;

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
                    />

                    {/* Primary Badge */}
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                        <Star className="h-3 w-3 fill-white" />
                        Primary
                      </span>
                    )}

                    {/* Reorder and Delete controls */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
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
                    <div className="absolute bottom-2 inset-x-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "left")}
                        className="rounded bg-black/70 p-1 text-white disabled:opacity-30 hover:bg-black"
                        title="Move earlier"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMove(idx, "right")}
                        className="rounded bg-black/70 p-1 text-white disabled:opacity-30 hover:bg-black"
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
