"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  AdminProductDetail,
  AdminProductFormData,
  AdminProductImageFormItem,
  AdminProductVariantFormItem,
} from "../types/products";
import { AdminProductFormSchema } from "../types/products";
import {
  createProductAction,
  updateProductAction,
} from "../actions/product-actions";
import { TiptapEditor } from "./tiptap-editor";
import { ProductImageUploader } from "./product-image-uploader";
import { ProductVariantsManager } from "./product-variants-manager";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";


interface ProductFormProps {
  initialData?: AdminProductDetail | null;
  categories: { id: string; name: string; slug: string; parent_id: string | null }[];
  sizeCharts: { id: string; name: string; measurement_unit: string }[];
}

export function ProductForm({
  initialData,
  categories,
  sizeCharts,
}: ProductFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(initialData?.id);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditMode);
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id || categories[0]?.id || ""
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [fabric, setFabric] = useState(initialData?.fabric || "");
  const [careInstructions, setCareInstructions] = useState(
    initialData?.care_instructions || ""
  );


  const [basePrice, setBasePrice] = useState<number | "">(
    initialData?.base_price ?? ""
  );
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">(
    initialData?.compare_at_price ?? ""
  );

  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seo_description || ""
  );
  const [seoKeywordsRaw, setSeoKeywordsRaw] = useState(
    (initialData?.seo_keywords || []).join(", ")
  );

  const [images, setImages] = useState<AdminProductImageFormItem[]>(
    initialData?.images || []
  );
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

  const [variants, setVariants] = useState<AdminProductVariantFormItem[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          {
            size: "M",
            color: "Ivory",
            color_hex: "#FDFBF7",
            sku: "VEL-NEW-IVR-M",
            stock_quantity: 10,
            price_override: null,
            is_active: true,
          },
        ]
  );

  const [sizeChartId, setSizeChartId] = useState<string>(
    initialData?.size_chart_id || ""
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(
    initialData?.is_featured ?? false
  );

  // Auto-slugify on title changes if slug was not manually touched
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleTrackDeletedUrl = (url: string) => {
    setDeletedImageUrls((prev) => [...prev, url]);
  };

  const handleSubmit = (publishImmediately: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate images have alt text
    const missingAlt = images.some((img) => !img.alt_text || !img.alt_text.trim());
    if (missingAlt) {
      setErrorMsg("Every product image requires descriptive alt text for SEO and accessibility.");
      return;
    }

    if (images.length === 0) {
      setErrorMsg("Please upload at least one product image.");
      return;
    }

    const hasPrimary = images.some((img) => img.is_primary);
    const normalizedImages = images.map((img, idx) => ({
      ...img,
      is_primary: hasPrimary ? img.is_primary : idx === 0,
    }));

    if (variants.length === 0) {
      setErrorMsg("At least one variant (size + color) is required.");
      return;
    }

    const payload: AdminProductFormData = {
      name,
      slug,
      category_id: categoryId,
      description,
      base_price: Number(basePrice) || 0,
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      fabric,
      care_instructions: careInstructions,
      is_active: publishImmediately,
      is_featured: isFeatured,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      seo_keywords: seoKeywordsRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      images: normalizedImages,
      variants,
      size_chart_id: sizeChartId || null,
    };


    const validation = AdminProductFormSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || "Validation failed.");
      return;
    }

    startTransition(async () => {
      if (isEditMode && initialData?.id) {
        const res = await updateProductAction(
          initialData.id,
          payload,
          deletedImageUrls
        );
        if (res.success) {
          setSuccessMsg(res.message || "Product updated successfully.");
          router.refresh();
        } else {
          setErrorMsg(res.error || "Failed to update product.");
        }
      } else {
        const res = await createProductAction(payload);
        if (res.success && res.productId) {
          setSuccessMsg("Product created successfully! Redirecting...");
          setTimeout(() => {
            router.push(`/admin/products/${res.productId}/edit`);
          }, 1000);
        } else {
          setErrorMsg(res.error || "Failed to create product.");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with back link, live preview, and action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Back to products list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {isEditMode ? `Edit: ${initialData?.name}` : "Create New Product"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? "Update apparel details, pricing, variants, and gallery assets."
                : "Add a luxury handcrafted piece to the Velaash catalog."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Preview Button if slug exists */}
          {slug && (
            <Link
              href={`/products/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview Storefront</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          )}

          {/* Save as Draft */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit(false)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
          >
            Save as Draft
          </button>

          {/* Publish Action */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isEditMode ? "Save & Publish" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banners */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Sections Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Main Info, Description, Images, Variants */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Basic Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Product Information</h3>

            <div className="space-y-3">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Chanderi Silk Embroidered Anarkali"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 px-3 py-1.5 focus-within:border-indigo-500">
                  <span className="text-xs text-slate-400 font-mono">/products/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManuallyEdited(true);
                    }}
                    placeholder="chanderi-silk-embroidered-anarkali"
                    className="w-full pl-1 text-xs font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rich Text Description (Tiptap) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Description (Rich Text)
                </label>
                <TiptapEditor content={description} onChange={setDescription} />
              </div>
            </div>
          </div>

          {/* Card 2: Fabric & Care Specifications */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Fabric &amp; Care Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fabric Composition
                </label>
                <input
                  type="text"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="e.g. 100% Chanderi Silk"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Care Instructions
                </label>
                <input
                  type="text"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="e.g. Dry clean only"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Product Gallery (Images) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Product Imagery</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload lookbook and detail photographs. Mark one as primary and enter alt text for every image.
              </p>
            </div>

            <ProductImageUploader
              images={images}
              onChange={setImages}
              onTrackDeletedUrl={handleTrackDeletedUrl}
            />
          </div>

          {/* Card 4: Variants & Inventory */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <ProductVariantsManager
              productName={name}
              productSlug={slug}
              variants={variants}
              onChange={setVariants}
            />
          </div>
        </div>

        {/* Right 1 Column: Pricing, Status, Size Chart, SEO */}
        <div className="space-y-6">
          {/* Card 5: Pricing */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Pricing Structure</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={basePrice}
                  onChange={(e) =>
                    setBasePrice(e.target.value ? parseFloat(e.target.value) : "")
                  }
                  placeholder="e.g. 4999"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Compare-at Price (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) =>
                    setCompareAtPrice(e.target.value ? parseFloat(e.target.value) : "")
                  }
                  placeholder="e.g. 6499"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Displays strikethrough original price for promotional discount display.
                </p>
              </div>
            </div>
          </div>

          {/* Card 6: Visibility & Flags */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Merchandising Settings</h3>

            <label className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800">Featured Showcase</span>
                <p className="text-[11px] text-slate-500">
                  Feature this piece on homepage carousels and highlight banners.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Size Chart Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Size Guide Chart
              </label>
              <select
                value={sizeChartId}
                onChange={(e) => setSizeChartId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Default Category Guide</option>
                {sizeCharts.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.measurement_unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 7: Search Engine Optimization (SEO) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-900 text-sm">Search Engine Metadata</h3>
            </div>

            <div className="space-y-3">
              {/* SEO Title with Character Count */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">SEO Page Title</label>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      seoTitle.length > 60
                        ? "text-rose-600 font-bold"
                        : seoTitle.length > 50
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {seoTitle.length} / 60
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={70}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Chanderi Silk Kurta | Velaash Luxury Pret"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* SEO Description with Character Count */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Meta Description</label>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      seoDescription.length > 160
                        ? "text-rose-600 font-bold"
                        : seoDescription.length > 130
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {seoDescription.length} / 160
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={170}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="e.g. Discover the handcrafted elegance of Velaash's peach Chanderi silk kurta with pure zari embroidery."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Search Keywords
                </label>
                <input
                  type="text"
                  value={seoKeywordsRaw}
                  onChange={(e) => setSeoKeywordsRaw(e.target.value)}
                  placeholder="silk kurta, festive pret, embroidered anarkali"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separate keywords with commas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
