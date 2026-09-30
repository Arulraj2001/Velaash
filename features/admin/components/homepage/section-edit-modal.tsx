"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Truck,
  RotateCcw,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Package,
  Headphones,
  Heart,
  LucideIcon,
  Search,
} from "lucide-react";
import type { AdminHomepageSection, TrustIconKey } from "../../types/homepage";
import { TRUST_ICON_KEYS } from "../../types/homepage";
import {
  updateHomepageSectionAction,
  uploadHomepageImageAction,
} from "../../actions/homepage-actions";
import type { ProductListItem } from "@/features/products";

const ICON_MAP: Record<TrustIconKey, LucideIcon> = {
  Truck,
  RotateCcw,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Package,
  Headphones,
  Heart,
};

interface TrustItemState {
  icon: string;
  title: string;
  description: string;
}

interface SectionEditModalProps {
  section: AdminHomepageSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
  allProducts: ProductListItem[];
}

export function SectionEditModal({
  section,
  isOpen,
  onClose,
  onSaved,
  allProducts,
}: SectionEditModalProps) {
  if (!isOpen || !section) return null;

  return (
    <SectionEditModalInner
      key={section.id}
      section={section}
      onClose={onClose}
      onSaved={onSaved}
      allProducts={allProducts}
    />
  );
}

function SectionEditModalInner({
  section,
  onClose,
  onSaved,
  allProducts,
}: {
  section: AdminHomepageSection;
  onClose: () => void;
  onSaved: (msg: string) => void;
  allProducts: ProductListItem[];
}) {
  const [title, setTitle] = useState(section.title || "");
  const [isActive, setIsActive] = useState(section.is_active);
  const [content, setContent] = useState<Record<string, unknown>>(section.content || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const handleFieldChange = (field: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const getString = (key: string, fallback = ""): string => {
    const val = content[key];
    return typeof val === "string" ? val : fallback;
  };

  const getNumber = (key: string, fallback = 0): number => {
    const val = content[key];
    return typeof val === "number" ? val : fallback;
  };

  const getTrustItems = (): TrustItemState[] => {
    if (Array.isArray(content.items)) {
      return content.items as TrustItemState[];
    }
    return [];
  };

  const getProductIds = (): string[] => {
    if (Array.isArray(content.product_ids)) {
      return content.product_ids as string[];
    }
    return [];
  };

  interface SlideItemState {
    id: string;
    tag?: string;
    headline: string;
    subtitle?: string;
    cta_text: string;
    cta_link: string;
    secondary_cta_text?: string;
    secondary_cta_link?: string;
    bg_image: string;
  }

  const getSlides = (): SlideItemState[] => {
    if (Array.isArray(content.slides)) {
      return content.slides as SlideItemState[];
    }
    return [];
  };

  const handleAddSlide = () => {
    const current = getSlides();
    const newSlide: SlideItemState = {
      id: `slide-${Date.now()}`,
      tag: "New Season Arrivals",
      headline: getString("headline") || "Modern Everyday Luxury",
      subtitle:
        getString("subtitle") ||
        "Effortless silhouettes, refined textures, and contemporary wardrobe essentials.",
      cta_text: getString("cta_text") || "Explore Collection",
      cta_link: getString("cta_link") || "/shop",
      secondary_cta_text: "Kurtas & Sets",
      secondary_cta_link: "/collections/kurtas-sets",
      bg_image:
        getString("bg_image") ||
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85",
    };
    handleFieldChange("slides", [...current, newSlide]);
  };

  const handleUpdateSlide = (index: number, field: keyof SlideItemState, val: string) => {
    const current = [...getSlides()];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      handleFieldChange("slides", current);
    }
  };

  const handleRemoveSlide = (index: number) => {
    const current = getSlides().filter((_, i) => i !== index);
    handleFieldChange("slides", current);
  };

  // Image Upload handler for hero banner
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadHomepageImageAction(formData);
      if (res.success && res.url) {
        handleFieldChange("bg_image", res.url);
      } else {
        setErrorMessage(res.error || "Failed to upload image.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await updateHomepageSectionAction(section.id, {
        title,
        is_active: isActive,
        content,
      });

      if (res.success) {
        onSaved("Section saved successfully.");
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to save section.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">
              Edit {section.section_type.replace(/_/g, " ").toUpperCase()} Section
            </h2>
            <p className="text-xs text-slate-500">
              Configure content and layout options for this section.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section Name & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Section Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hero Banner"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Visibility Status
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="sectionActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="sectionActiveToggle" className="text-sm text-slate-700 cursor-pointer">
                  {isActive ? "Visible on live homepage" : "Hidden (draft)"}
                </label>
              </div>
            </div>
          </div>

          {/* ==============================================================
              SECTION TYPE SPECIFIC FORMS
             ============================================================== */}

          {/* 1. HERO BANNER */}
          {section.section_type === "hero_banner" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={getString("headline")}
                  onChange={(e) => handleFieldChange("headline", e.target.value)}
                  placeholder="e.g. Modern Everyday Luxury"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtitle / Subheading
                </label>
                <textarea
                  rows={2}
                  value={getString("subtitle") || getString("subheading")}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="e.g. Effortless silhouettes and contemporary styles..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary CTA Button Text <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={getString("cta_text") || getString("cta_label")}
                    onChange={(e) => handleFieldChange("cta_text", e.target.value)}
                    placeholder="e.g. Explore Collection"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary CTA Link <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={getString("cta_link")}
                    onChange={(e) => handleFieldChange("cta_link", e.target.value)}
                    placeholder="e.g. /shop"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secondary CTA Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={getString("secondary_cta_text")}
                    onChange={(e) => handleFieldChange("secondary_cta_text", e.target.value)}
                    placeholder="e.g. Kurtas & Sets"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secondary CTA Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={getString("secondary_cta_link")}
                    onChange={(e) => handleFieldChange("secondary_cta_link", e.target.value)}
                    placeholder="e.g. /collections/kurtas-sets"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Background Image Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Background Image <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-3">
                  {getString("bg_image") ? (
                    <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <Image
                        src={getString("bg_image")}
                        alt="Hero preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-600" />
                          <span>Upload Image</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400">or enter image URL below</span>
                  </div>

                  <input
                    type="text"
                    required
                    value={getString("bg_image") || getString("image_url")}
                    onChange={(e) => handleFieldChange("bg_image", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Multi-Slide Carousel Manager */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Rotating Carousel Slides (Optional)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add multiple slides to automatically turn your hero into an interactive rotating banner.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slide</span>
                  </button>
                </div>

                {getSlides().length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-xs text-slate-500">
                      No extra slides added yet. The single hero banner above will be used. Click &quot;Add Slide&quot; to build a multi-slide hero carousel.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSlides().map((slide, idx) => (
                      <div
                        key={slide.id || idx}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Slide {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlide(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Tag / Capsule
                            </label>
                            <input
                              type="text"
                              value={slide.tag || ""}
                              onChange={(e) => handleUpdateSlide(idx, "tag", e.target.value)}
                              placeholder="e.g. Festive Capsule"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Headline
                            </label>
                            <input
                              type="text"
                              value={slide.headline || ""}
                              onChange={(e) => handleUpdateSlide(idx, "headline", e.target.value)}
                              placeholder="e.g. Modern Everyday Luxury"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={slide.subtitle || ""}
                            onChange={(e) => handleUpdateSlide(idx, "subtitle", e.target.value)}
                            placeholder="e.g. Effortless silhouettes and contemporary styles..."
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Button Text
                            </label>
                            <input
                              type="text"
                              value={slide.cta_text || ""}
                              onChange={(e) => handleUpdateSlide(idx, "cta_text", e.target.value)}
                              placeholder="e.g. Explore Collection"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Button Link
                            </label>
                            <input
                              type="text"
                              value={slide.cta_link || ""}
                              onChange={(e) => handleUpdateSlide(idx, "cta_link", e.target.value)}
                              placeholder="e.g. /shop"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Background Image URL
                          </label>
                          <input
                            type="text"
                            value={slide.bg_image || ""}
                            onChange={(e) => handleUpdateSlide(idx, "bg_image", e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. CATEGORY GRID */}
          {section.section_type === "category_grid" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
                <strong>Live Catalog Integration:</strong> This section automatically renders your active
                categories from the Categories management screen. You can customize the section header
                and subtext here, or toggle visibility above.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={getString("title", "Explore by Category")}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="e.g. Explore by Category"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={getString("subtitle")}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="e.g. Thoughtfully tailored pieces across modern silhouettes."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* 3. FEATURED PRODUCTS */}
          {section.section_type === "featured_products" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section Header Title
                  </label>
                  <input
                    type="text"
                    value={getString("title", "Featured Arrivals")}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="e.g. Featured Arrivals"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={getString("subtitle")}
                    onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                    placeholder="e.g. Handpicked styles from our collection."
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Mode Toggle: Auto vs Manual */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Merchandising Selection Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleFieldChange("mode", "auto")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      getString("mode", "auto") === "auto"
                        ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">
                      Auto-Select (Recommended)
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Pulls products marked with the &apos;Featured&apos; flag in Catalog
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange("mode", "manual")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      getString("mode") === "manual"
                        ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">
                      Manual Curation
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Explicitly pick and order specific products for this section
                    </span>
                  </button>
                </div>
              </div>

              {/* Auto Mode: Product count limit */}
              {getString("mode", "auto") === "auto" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Products to Display
                  </label>
                  <select
                    value={getNumber("limit", 8)}
                    onChange={(e) => handleFieldChange("limit", Number(e.target.value))}
                    className="w-full sm:w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={4}>4 products</option>
                    <option value={8}>8 products (recommended)</option>
                    <option value={12}>12 products</option>
                    <option value={16}>16 products</option>
                  </select>
                </div>
              )}

              {/* Manual Mode: Searchable Product Picker */}
              {getString("mode") === "manual" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Curated Products ({getProductIds().length} selected)
                    </label>
                    {getProductIds().length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange("product_ids", [])}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search store products by name or category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Product items checklist */}
                  <div className="border border-slate-200 rounded-xl divide-y max-h-56 overflow-y-auto bg-slate-50/50">
                    {allProducts
                      .filter((p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        (p.category_name && p.category_name.toLowerCase().includes(productSearch.toLowerCase()))
                      )
                      .map((prod) => {
                        const curIds = getProductIds();
                        const isSelected = curIds.includes(prod.id);
                        const selectionIndex = curIds.indexOf(prod.id);

                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              if (isSelected) {
                                handleFieldChange(
                                  "product_ids",
                                  curIds.filter((id) => id !== prod.id)
                                );
                              } else {
                                handleFieldChange("product_ids", [...curIds, prod.id]);
                              }
                            }}
                            className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors ${
                              isSelected ? "bg-amber-50/80" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {prod.category_name || "General"} &bull; ₹{prod.base_price.toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                                #{selectionIndex + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}          {/* 4. TRUST / VALUE STRIP */}
          {section.section_type === "value_strip" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Header Title
                </label>
                <input
                  type="text"
                  value={getString("title", "Our Commitments")}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="e.g. Our Commitments"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Items List (max 4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Trust Items (Max 4)
                  </label>
                  {getTrustItems().length < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        const curItems = [...getTrustItems()];
                        curItems.push({
                          icon: "Truck",
                          title: "New Reassurance",
                          description: "Short customer benefit explanation.",
                        });
                        handleFieldChange("items", curItems);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {getTrustItems().map((item, idx: number) => {
                    const CurrentIcon = ICON_MAP[item.icon as TrustIconKey] || Truck;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            Item #{idx + 1}
                          </span>
                          {getTrustItems().length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = getTrustItems();
                                const newItems = currentList.filter((_, i) => i !== idx);
                                handleFieldChange("items", newItems);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Icon Selector */}
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Icon
                            </label>
                            <div className="relative">
                              <select
                                value={item.icon || "Truck"}
                                onChange={(e) => {
                                  const updated = [...getTrustItems()];
                                  updated[idx] = { ...updated[idx], icon: e.target.value };
                                  handleFieldChange("items", updated);
                                }}
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                              >
                                {TRUST_ICON_KEYS.map((k) => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                              </select>
                              <CurrentIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Title */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              required
                              value={item.title || ""}
                              onChange={(e) => {
                                const updated = [...getTrustItems()];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                handleFieldChange("items", updated);
                              }}
                              placeholder="e.g. Pan-India Delivery"
                              className="w-full px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Description Text
                          </label>
                          <input
                            type="text"
                            required
                            value={item.description || ""}
                            onChange={(e) => {
                              const updated = [...getTrustItems()];
                              updated[idx] = { ...updated[idx], description: e.target.value };
                              handleFieldChange("items", updated);
                            }}
                            placeholder="e.g. Reliable domestic shipping across all PIN codes."
                            className="w-full px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. NEWSLETTER */}
          {section.section_type === "newsletter" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={getString("headline")}
                  onChange={(e) => handleFieldChange("headline", e.target.value)}
                  placeholder="e.g. Join the Velaash Circle"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtext Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={getString("subtext")}
                  onChange={(e) => handleFieldChange("subtext", e.target.value)}
                  placeholder="e.g. Subscribe to receive updates on new arrivals, seasonal collections..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                Note: The actual email subscription input form and verification mechanism are managed
                automatically.
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Section</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
