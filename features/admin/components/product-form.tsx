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
import { ProductSpecificationsManager } from "./product-specifications-manager";
import type { SpecificationItem } from "../types/products";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  RotateCcw,
} from "lucide-react";


interface ProductFormProps {
  initialData?: AdminProductDetail | null;
  categories: { id: string; name: string; slug: string; parent_id: string | null; is_active?: boolean }[];
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

  // Hierarchical category options formatted with parent context
  const formattedCategoryOptions = React.useMemo(() => {
    const topLevel: typeof categories = [];
    const subCategories: typeof categories = [];

    for (const c of categories) {
      if (!c.parent_id) {
        topLevel.push(c);
      } else {
        subCategories.push(c);
      }
    }

    const items: { id: string; label: string; isTopLevel: boolean }[] = [];

    for (const parent of topLevel) {
      const parentInactive = parent.is_active === false ? " (Inactive)" : "";
      items.push({
        id: parent.id,
        label: `${parent.name}${parentInactive}`,
        isTopLevel: true,
      });

      const children = subCategories.filter((sub) => sub.parent_id === parent.id);
      for (const child of children) {
        const childInactive = child.is_active === false ? " (Inactive)" : "";
        items.push({
          id: child.id,
          label: `  ↳ ${child.name}${childInactive}`,
          isTopLevel: false,
        });
      }
    }

    // Include any subcategories whose parent wasn't in topLevel (edge case fallback)
    for (const sub of subCategories) {
      if (!items.some((i) => i.id === sub.id)) {
        const inactive = sub.is_active === false ? " (Inactive)" : "";
        items.push({
          id: sub.id,
          label: `${sub.name}${inactive}`,
          isTopLevel: false,
        });
      }
    }

    return items;
  }, [categories]);


  const [basePrice, setBasePrice] = useState<number | "">(
    initialData?.base_price ?? ""
  );
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">(
    initialData?.compare_at_price ?? ""
  );

  // Indian Logistics & Taxation State
  const [weightGrams, setWeightGrams] = useState<number | "">(initialData?.weight_grams ?? "");
  const [lengthCm, setLengthCm] = useState<number | "">(initialData?.length_cm ?? "");
  const [widthCm, setWidthCm] = useState<number | "">(initialData?.width_cm ?? "");
  const [heightCm, setHeightCm] = useState<number | "">(initialData?.height_cm ?? "");
  const [hsnCode, setHsnCode] = useState<string>(initialData?.hsn_code || "6204");
  const [gstRate, setGstRate] = useState<number>(initialData?.gst_rate ?? 5);

  // Garment Specific Attributes
  const [craftsmanship, setCraftsmanship] = useState<string>(initialData?.craftsmanship || "");
  const [isMadeToOrder, setIsMadeToOrder] = useState<boolean>(initialData?.is_made_to_order ?? false);
  const [blouseIncluded, setBlouseIncluded] = useState<boolean>(Boolean(initialData?.blouse_included));
  const [sareeLengthMeters, setSareeLengthMeters] = useState<number | "">(initialData?.saree_length_meters ?? "");

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

  const [hasVariants, setHasVariants] = useState<boolean>(
    initialData?.has_variants !== undefined
      ? initialData.has_variants
      : initialData?.variants && initialData.variants.length > 0
        ? true
        : true
  );
  const [stockQuantity, setStockQuantity] = useState<number | "">(
    initialData?.stock_quantity ?? 10
  );
  const [specifications, setSpecifications] = useState<SpecificationItem[]>(
    initialData?.specifications || []
  );

  const [sizeChartId, setSizeChartId] = useState<string>(
    initialData?.size_chart_id || ""
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(
    initialData?.is_featured ?? false
  );
  const [freeShippingActive, setFreeShippingActive] = useState<boolean>(
    initialData?.free_shipping_active ?? false
  );
  const [freeShippingStart, setFreeShippingStart] = useState<string>(
    initialData?.free_shipping_start ? initialData.free_shipping_start.slice(0, 10) : ""
  );
  const [freeShippingEnd, setFreeShippingEnd] = useState<string>(
    initialData?.free_shipping_end ? initialData.free_shipping_end.slice(0, 10) : ""
  );
  const [freeShippingBadgeText, setFreeShippingBadgeText] = useState<string>(
    initialData?.free_shipping_badge_text || "🌾 Special Offer: Free Delivery"
  );
  const [isReturnable, setIsReturnable] = useState<boolean>(
    initialData?.is_returnable !== undefined && initialData?.is_returnable !== null
      ? Boolean(initialData.is_returnable)
      : true
  );
  const [returnOverrideNote, setReturnOverrideNote] = useState<string>(
    initialData?.return_override_note || ""
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

    if (hasVariants && variants.length === 0) {
      setErrorMsg("At least one variant (size + color) is required when variants are enabled.");
      return;
    }

    if (!hasVariants && (stockQuantity === "" || Number(stockQuantity) < 0)) {
      setErrorMsg("Please enter a valid stock quantity for this product.");
      return;
    }

    const payload: AdminProductFormData = {
      name,
      slug,
      category_id: categoryId,
      description,
      base_price: Number(basePrice) || 0,
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      has_variants: hasVariants,
      stock_quantity: hasVariants ? 0 : Number(stockQuantity) || 0,
      specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
      fabric: fabric || null,
      care_instructions: careInstructions || null,
      craftsmanship: craftsmanship || null,
      is_active: publishImmediately,
      is_featured: isFeatured,
      is_made_to_order: isMadeToOrder,

      // Logistics & GST Compliance
      weight_grams: weightGrams ? Number(weightGrams) : null,
      length_cm: lengthCm ? Number(lengthCm) : null,
      width_cm: widthCm ? Number(widthCm) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      hsn_code: hsnCode || "6204",
      gst_rate: Number(gstRate) || 5,

      // Garment Attributes
      blouse_included: blouseIncluded,
      saree_length_meters: sareeLengthMeters ? Number(sareeLengthMeters) : null,

      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      seo_keywords: seoKeywordsRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      images: normalizedImages,
      variants: hasVariants ? variants : [],
      size_chart_id: hasVariants ? (sizeChartId || null) : null,
      free_shipping_active: freeShippingActive,
      free_shipping_start: freeShippingStart ? new Date(freeShippingStart).toISOString() : null,
      free_shipping_end: freeShippingEnd ? new Date(freeShippingEnd).toISOString() : null,
      free_shipping_badge_text: freeShippingBadgeText || null,
      is_returnable: isReturnable,
      return_override_note: returnOverrideNote || null,
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
          setDeletedImageUrls([]);
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
                  {formattedCategoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
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
                  Care Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="e.g. Dry clean only (leave empty if not applicable)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Craftsmanship &amp; Artisan Technique
                </label>
                <input
                  type="text"
                  value={craftsmanship}
                  onChange={(e) => setCraftsmanship(e.target.value)}
                  placeholder="e.g. Handcrafted gota patti work with hand-spun threads"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Flexible Product Specifications (Additive) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <ProductSpecificationsManager
              specifications={specifications}
              onChange={setSpecifications}
            />
          </div>

          {/* Card: Shipping Logistics & Parcel Dimensions (for Shiprocket) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Shipping Logistics &amp; Parcel Dimensions</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Required for Shiprocket automated shipping label generation and courier volumetric calculation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Weight (grams)
                </label>
                <input
                  type="number"
                  min="1"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="e.g. 500"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="e.g. 30"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="e.g. 25"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Promotional & Time-Limited Free Delivery Offer */}
          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🌾</span>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Promotional Free Delivery Offer
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    Product-Specific
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Offer time-limited zero shipping on this product across customized dates. Multiple products can have independent offers and dates simultaneously.
                </p>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={freeShippingActive}
                  onChange={(e) => setFreeShippingActive(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            {freeShippingActive && (
              <div className="pt-3 border-t border-amber-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Promotional Badge Text
                  </label>
                  <input
                    type="text"
                    value={freeShippingBadgeText}
                    onChange={(e) => setFreeShippingBadgeText(e.target.value)}
                    placeholder="e.g. 🌾 Special Offer: Free Delivery"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Displays as a promotional banner badge on the product card and product page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Offer Start Date (Inclusive)
                    </label>
                    <input
                      type="date"
                      value={freeShippingStart}
                      onChange={(e) => setFreeShippingStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Leave empty to activate immediately</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Offer Expiry Date (Inclusive)
                    </label>
                    <input
                      type="date"
                      value={freeShippingEnd}
                      onChange={(e) => setFreeShippingEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Leave empty for an ongoing offer</p>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50/80 border border-amber-200/60 p-2.5 text-[11px] text-amber-900 flex items-center gap-2">
                  <span className="font-semibold text-xs shrink-0">Current Status:</span>
                  <span>
                    {(() => {
                      const now = new Date();
                      const start = freeShippingStart ? new Date(freeShippingStart) : null;
                      const end = freeShippingEnd ? new Date(freeShippingEnd) : null;
                      if (end) end.setHours(23, 59, 59, 999);
                      if (start && now < start) return `Scheduled — Starts on ${start.toLocaleDateString()}`;
                      if (end && now > end) return "Expired — Offer date has ended";
                      return "Active Now — Free shipping applies to this product at checkout!";
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Returns & Exchange Eligibility Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-800" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Returns &amp; Exchange Eligibility
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isReturnable
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {isReturnable ? "Returnable (Standard Policy)" : "Final Sale / Non-Returnable"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Toggle whether customers can request returns/exchanges for this item. Turn OFF for custom-stitched sarees, made-to-order couture, or clearance items.
                </p>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={isReturnable}
                  onChange={(e) => setIsReturnable(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            {!isReturnable && (
              <div className="pt-3 border-t border-rose-100 space-y-2.5">
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Final Sale Notice:</strong> On the product page and cart, the standard return badge will be replaced with a prominent <em>&ldquo;Final Sale (Non-Returnable)&rdquo;</em> disclosure.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Non-Returnable Reason / Disclosure (Optional)
                  </label>
                  <input
                    type="text"
                    value={returnOverrideNote}
                    onChange={(e) => setReturnOverrideNote(e.target.value)}
                    placeholder="e.g. Made-to-order couture / Custom stitching / Final Clearance"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Displayed alongside the Final Sale notice in the product accordion and checkout summary.
                  </p>
                </div>
              </div>
            )}
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
              productName={name}
            />
          </div>

          {/* Card 4: Product Type & Inventory */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Product Inventory &amp; Variants</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose whether this product requires size/color variant selection (e.g. clothing) or is a simple standalone item (e.g. pooja brass items).
              </p>
            </div>

            {/* Product Type Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setHasVariants(true)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  hasVariants
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${hasVariants ? "border-brand-dark" : "border-slate-400"}`}>
                  {hasVariants && <div className="w-2 h-2 rounded-full bg-brand-dark" />}
                </div>
                <div>
                  <div className="text-xs font-semibold">Has Variants (Size / Color)</div>
                  <div className="text-[11px] text-slate-500">Clothing &amp; apparel with size/color options</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHasVariants(false)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  !hasVariants
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!hasVariants ? "border-brand-dark" : "border-slate-400"}`}>
                  {!hasVariants && <div className="w-2 h-2 rounded-full bg-brand-dark" />}
                </div>
                <div>
                  <div className="text-xs font-semibold">Simple Product (No Variants)</div>
                  <div className="text-[11px] text-slate-500">Lamps, brass items, pooja essentials</div>
                </div>
              </button>
            </div>

            {hasVariants ? (
              <ProductVariantsManager
                productName={name}
                productSlug={slug}
                variants={variants}
                onChange={setVariants}
              />
            ) : (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Direct Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="max-w-xs">
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="e.g. 25"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Stock is tracked directly on this product row. Customers can add it directly to cart without selecting a size or color.
                </p>
              </div>
            )}
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

          {/* Card: Indian GST & Compliance */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Taxation &amp; Garment Attributes</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="6204"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default 6204</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Apparel &le; ₹1,000)</option>
                    <option value="12">12% (Luxury Pret &gt; ₹1,000)</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              {/* Made to order toggle */}
              <label className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800">Made to Order / Measure</span>
                  <p className="text-[11px] text-slate-500">
                    Bespoke couture piece crafted upon order.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isMadeToOrder}
                  onChange={(e) => setIsMadeToOrder(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              {/* Saree attributes */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={blouseIncluded}
                    onChange={(e) => setBlouseIncluded(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">Blouse Included</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saree Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={sareeLengthMeters}
                    onChange={(e) => setSareeLengthMeters(e.target.value ? parseFloat(e.target.value) : "")}
                    placeholder="e.g. 5.5"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
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

            {/* Size Chart Selection (Only applicable when product has variants) */}
            {hasVariants && (
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
            )}
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
