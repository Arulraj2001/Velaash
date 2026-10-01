"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import {
  X,
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderTree,
  ImageIcon,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import type {
  AdminCategoryItem,
  AdminCategoryFormData,
  AdminCategorySizeChartData,
} from "../types/categories";
import {
  createCategoryAction,
  updateCategoryAction,
  uploadCategoryImageAction,
} from "../actions/category-actions";
import { CategorySizeChartEditor } from "./category-size-chart-editor";
import { getCategoryBannerConfig } from "@/features/products/constants/category-banners";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AdminCategoryItem | null;
  parentCategoryIdPreset?: string | null;
  topLevelCategories: { id: string; name: string; slug: string }[];
  onSuccess: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryFormModal({
  isOpen,
  onClose,
  initialData,
  parentCategoryIdPreset,
  topLevelCategories,
  onSuccess,
}: CategoryFormModalProps) {
  const isEditMode = Boolean(initialData?.id);
  const hasExistingChildren = Boolean(
    initialData?.subcategories && initialData.subcategories.length > 0
  );

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditMode);
  const [parentId, setParentId] = useState<string>(
    initialData?.parent_id || parentCategoryIdPreset || ""
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [displayOrder, setDisplayOrder] = useState<number>(
    initialData?.display_order ?? 1
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seo_description || ""
  );
  const [sizeChart, setSizeChart] = useState<AdminCategorySizeChartData | null>(
    initialData?.size_chart || null
  );

  // Storefront Page Header Banner states
  const [bannerImageUrl, setBannerImageUrl] = useState(
    initialData?.banner_image_url || ""
  );
  const [bannerBadge, setBannerBadge] = useState(
    initialData?.banner_badge || ""
  );
  const [bannerSubtitle, setBannerSubtitle] = useState(
    initialData?.banner_subtitle || ""
  );
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugManuallyEdited && !isEditMode) {
      setSlug(slugify(newName));
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadCategoryImageAction(formData);
    setIsUploading(false);

    if (res.success && res.url) {
      setImageUrl(res.url);
    } else {
      setErrorMsg(res.error || "Failed to upload image.");
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadCategoryImageAction(formData);
    setIsUploadingBanner(false);

    if (res.success && res.url) {
      setBannerImageUrl(res.url);
    } else {
      setErrorMsg(res.error || "Failed to upload banner image.");
    }
  };

  const handleAutofillPreset = () => {
    const preset = getCategoryBannerConfig(slug || name);
    if (preset) {
      setBannerImageUrl(preset.imageUrl);
      setBannerBadge(preset.badge);
      setBannerSubtitle(preset.description);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Category name is required.");
      return;
    }
    if (!slug.trim()) {
      setErrorMsg("Category slug is required.");
      return;
    }

    const payload: AdminCategoryFormData = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      parent_id: parentId ? parentId : null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      banner_image_url: bannerImageUrl.trim() || null,
      banner_badge: bannerBadge.trim() || null,
      banner_subtitle: bannerSubtitle.trim() || null,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      size_chart: sizeChart,
    };

    startTransition(async () => {
      if (isEditMode && initialData?.id) {
        const res = await updateCategoryAction(initialData.id, payload);
        if (res.success) {
          setSuccessMsg(res.message || "Category updated successfully.");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        } else {
          setErrorMsg(res.error || "Failed to update category.");
        }
      } else {
        const res = await createCategoryAction(payload);
        if (res.success) {
          setSuccessMsg(res.message || "Category created successfully.");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        } else {
          setErrorMsg(res.error || "Failed to create category.");
        }
      }
    });
  };

  // Filter available parent categories: cannot be self
  const availableParents = topLevelCategories.filter(
    (c) => c.id !== initialData?.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                {isEditMode ? `Edit Category: ${initialData?.name}` : "Create New Category"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditMode
                  ? "Update taxonomy, display order, or size guide configuration."
                  : "Add a top-level category or nested sub-category."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Kurtas &amp; Sets"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slug (URL Identifier) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                placeholder="e.g. kurtas-sets"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Live URL: /category/{slug || "slug"}
              </span>
            </div>
          </div>

          {/* Section 2: Hierarchy & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Category
              </label>
              {hasExistingChildren ? (
                <div>
                  <input
                    type="text"
                    disabled
                    value="None (Top-Level Category — Contains sub-categories)"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-amber-600 mt-1">
                    Cannot be nested under another parent because it already contains sub-categories (maximum 2 hierarchy levels).
                  </p>
                </div>
              ) : (
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">None (Top-Level Category)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      Sub-category of: {parent.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Used on catalog pages and headers)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Everyday and festive kurtas crafted in contemporary silhouettes..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Section 4: Grid Thumbnail Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Grid Thumbnail Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={name || "Category image"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>{isUploading ? "Uploading..." : "Upload New Image"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      disabled={isUploading}
                      className="sr-only"
                    />
                  </label>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Recommended: 800×800 JPG, PNG or WebP (max 5MB).
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Storefront Page Header Banner Settings */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Storefront Page Header Banner
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Hero letterbox banner, gold pill badge, and editorial subtitle shown on this category page.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutofillPreset}
                title="Autofill banner image and description from curated Velaash collection presets"
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors shrink-0"
              >
                <Wand2 className="h-3 w-3 text-amber-600" />
                <span>Autofill Presets</span>
              </button>
            </div>

            {/* Banner Image Preview / Upload */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Banner Background Image (Wide 16:9 or 21:9 Letterbox)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative h-20 w-36 sm:w-44 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 flex items-center justify-center">
                  {bannerImageUrl ? (
                    <>
                      <Image
                        src={bannerImageUrl}
                        alt="Category banner preview"
                        fill
                        sizes="180px"
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <span className="absolute bottom-1 left-2 text-[9px] text-white/90 font-mono">
                        Banner Preview
                      </span>
                    </>
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="h-5 w-5 mx-auto mb-0.5 opacity-60" />
                      <span className="text-[10px]">No banner set</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      {isUploadingBanner ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      <span>{isUploadingBanner ? "Uploading..." : "Upload Banner"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleBannerFileChange}
                        disabled={isUploadingBanner}
                        className="sr-only"
                      />
                    </label>

                    {bannerImageUrl && (
                      <button
                        type="button"
                        onClick={() => setBannerImageUrl("")}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Banner Badge & Subtitle Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Collection Pill Badge
                </label>
                <input
                  type="text"
                  value={bannerBadge}
                  onChange={(e) => setBannerBadge(e.target.value)}
                  placeholder="e.g. Timeless Indian Weaves"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Editorial Subtitle / Narrative
                </label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted Chanderi and festive anarkalis tailored for daily poise..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Status Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Active Category Status
              </span>
              <span className="text-[11px] text-slate-500 block">
                When inactive, this category and its subcategories are hidden from public store navigation.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">
                {isActive ? "Active" : "Inactive"}
              </span>
            </label>
          </div>

          {/* Section 6: SEO Metadata */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-slate-800">
              Search Engine Optimization (SEO)
            </h4>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Meta Title</span>
                <span className={seoTitle.length > 60 ? "text-amber-600 font-semibold" : ""}>
                  {seoTitle.length}/60 chars recommended
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g. Designer Kurtas &amp; Anarkali Sets | Velaash"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Meta Description</span>
                <span className={seoDescription.length > 160 ? "text-amber-600 font-semibold" : ""}>
                  {seoDescription.length}/160 chars recommended
                </span>
              </div>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="e.g. Discover hand-finished kurtas and contemporary sets tailored in pure Chanderi and breathable cottons..."
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 7: Size Chart Matrix Editor */}
          <CategorySizeChartEditor
            value={sizeChart}
            onChange={setSizeChart}
            categoryName={name}
          />

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditMode ? "Save Changes" : "Create Category"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
