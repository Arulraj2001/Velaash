"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Star,
  LucideIcon,
  Search,
  ExternalLink,
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
  onSaved: (msg: string, updatedSection?: AdminHomepageSection) => void;
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
  onSaved: (msg: string, updatedSection?: AdminHomepageSection) => void;
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

  const DEFAULT_HERO_SLIDES: SlideItemState[] = [
    {
      id: "slide-1",
      tag: "Spring / Summer 2026",
      headline: getString("headline") || "Modern Everyday Luxury",
      subtitle:
        getString("subtitle") ||
        "Effortless silhouettes, refined textures, and contemporary wardrobe essentials designed for everyday elegance.",
      cta_text: getString("cta_text") || "Explore Collection",
      cta_link: getString("cta_link") || "/shop",
      secondary_cta_text: getString("secondary_cta_text") || "Kurtas & Sets",
      secondary_cta_link: getString("secondary_cta_link") || "/collections/kurtas-sets",
      bg_image:
        getString("bg_image") ||
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
    },
    {
      id: "slide-2",
      tag: "Festive Capsule",
      headline: "Timeless Grace, Artisanal Craft",
      subtitle:
        "Handcrafted threadwork, rich jewel tones, and opulent fabrics tailored for your special celebrations.",
      cta_text: "Shop Festive",
      cta_link: "/collections/kurtas-sets",
      secondary_cta_text: "Dresses",
      secondary_cta_link: "/collections/dresses",
      bg_image:
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85",
    },
    {
      id: "slide-3",
      tag: "Contemporary Co-Ords",
      headline: "The Art of Breathable Dressing",
      subtitle:
        "Pure cottons and relaxed co-ords designed to keep you poised from morning meetings to evening dinners.",
      cta_text: "Discover Co-ords",
      cta_link: "/collections/co-ord-sets",
      secondary_cta_text: "View All",
      secondary_cta_link: "/shop",
      bg_image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85",
    },
  ];

  const getSlides = (): SlideItemState[] => {
    if (Array.isArray(content.slides) && content.slides.length > 0) {
      return content.slides as SlideItemState[];
    }
    return DEFAULT_HERO_SLIDES;
  };

  const handleAddSlide = () => {
    const current = getSlides();
    const newSlide: SlideItemState = {
      id: `slide-${Date.now()}`,
      tag: "New Arrivals",
      headline: "New Luxury Silhouette",
      subtitle: "Effortless silhouettes, refined textures, and contemporary wardrobe essentials.",
      cta_text: "Explore Collection",
      cta_link: "/shop",
      secondary_cta_text: "",
      secondary_cta_link: "",
      bg_image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
    };
    handleFieldChange("slides", [...current, newSlide]);
  };

  const handleUpdateSlide = (index: number, field: keyof SlideItemState, val: string) => {
    const current = [...getSlides()];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      const updates: Record<string, unknown> = { slides: current };
      if (index === 0) {
        if (field === "headline") updates.headline = val;
        if (field === "subtitle") updates.subtitle = val;
        if (field === "cta_text") updates.cta_text = val;
        if (field === "cta_link") updates.cta_link = val;
        if (field === "secondary_cta_text") updates.secondary_cta_text = val;
        if (field === "secondary_cta_link") updates.secondary_cta_link = val;
        if (field === "bg_image") updates.bg_image = val;
      }
      setContent((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleRemoveSlide = (index: number) => {
    const current = getSlides().filter((_, i) => i !== index);
    const updates: Record<string, unknown> = { slides: current };
    if (current[0]) {
      updates.headline = current[0].headline;
      updates.subtitle = current[0].subtitle;
      updates.cta_text = current[0].cta_text;
      updates.cta_link = current[0].cta_link;
      updates.secondary_cta_text = current[0].secondary_cta_text;
      updates.secondary_cta_link = current[0].secondary_cta_link;
      updates.bg_image = current[0].bg_image;
    }
    setContent((prev) => ({ ...prev, ...updates }));
  };

  const handleSlideImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadHomepageImageAction(formData);
      if (res.success && res.url) {
        handleUpdateSlide(index, "bg_image", res.url);
      } else {
        setErrorMessage(res.error || "Failed to upload image.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Image Upload handler for hero banner & couture spotlight
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField = "bg_image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadHomepageImageAction(formData);
      if (res.success && res.url) {
        handleFieldChange(targetField, res.url);
      } else {
        setErrorMessage(res.error || "Failed to upload image.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  interface OccasionItemState {
    id: string;
    name: string;
    subtitle: string;
    slug?: string;
    image: string;
    href: string;
  }

  const DEFAULT_OCCASION_ITEMS: OccasionItemState[] = [
    {
      id: "occ-1",
      name: "Festive Capsule",
      subtitle: "Zari, Silk Blends & Brocades",
      slug: "festive",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
      href: "/collections/kurtas-sets",
    },
    {
      id: "occ-2",
      name: "Workday Grace",
      subtitle: "Clean cuts & breathable comfort",
      slug: "workwear",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
      href: "/shop?sort=newest",
    },
    {
      id: "occ-3",
      name: "Evening Soirées",
      subtitle: "Statement Co-Ords & Drapes",
      slug: "evening",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      href: "/collections/co-ord-sets",
    },
    {
      id: "occ-4",
      name: "Casual Brunches",
      subtitle: "Airy silhouettes & subtle prints",
      slug: "brunch",
      image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80",
      href: "/collections/dresses",
    },
  ];

  const getOccasionItems = (): OccasionItemState[] => {
    if (Array.isArray(content.items) && content.items.length > 0) {
      return content.items as OccasionItemState[];
    }
    return DEFAULT_OCCASION_ITEMS;
  };

  const handleAddOccasion = () => {
    const current = getOccasionItems();
    const newItem: OccasionItemState = {
      id: `occ-${Date.now()}`,
      name: "New Occasion",
      subtitle: "Curated collection",
      slug: "new-occasion",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
      href: "/shop",
    };
    handleFieldChange("items", [...current, newItem]);
  };

  const handleUpdateOccasion = (index: number, field: keyof OccasionItemState, val: string) => {
    const current = [...getOccasionItems()];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      handleFieldChange("items", current);
    }
  };

  const handleRemoveOccasion = (index: number) => {
    const current = getOccasionItems().filter((_, i) => i !== index);
    handleFieldChange("items", current);
  };

  const handleOccasionImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadHomepageImageAction(formData);
      if (res.success && res.url) {
        handleUpdateOccasion(index, "image", res.url);
      } else {
        setErrorMessage(res.error || "Failed to upload image.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  interface TestimonialItemState {
    id: string;
    name: string;
    location: string;
    rating: number;
    review: string;
    product_name?: string;
  }

  const getTestimonialItems = (): TestimonialItemState[] => {
    if (Array.isArray(content.items)) {
      return content.items as TestimonialItemState[];
    }
    return [];
  };

  const handleAddTestimonial = () => {
    const current = getTestimonialItems();
    const newItem: TestimonialItemState = {
      id: `testi-${Date.now()}`,
      name: "New Patron",
      location: "Mumbai",
      rating: 5,
      review:
        "The fabric quality of the Chanderi Kurta set is simply unmatched. It breathes so well and feels wonderfully luxurious.",
      product_name: "Chanderi Anarkali Set",
    };
    handleFieldChange("items", [...current, newItem]);
  };

  const handleUpdateTestimonial = (
    index: number,
    field: keyof TestimonialItemState,
    val: unknown
  ) => {
    const current = [...getTestimonialItems()];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      handleFieldChange("items", current);
    }
  };

  const handleRemoveTestimonial = (index: number) => {
    const current = getTestimonialItems().filter((_, i) => i !== index);
    handleFieldChange("items", current);
  };

  const normalizeLink = (url: string | undefined): string => {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:")
    ) {
      return trimmed;
    }
    return `/${trimmed}`;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const finalContent = { ...content };

      if (section.section_type === "hero_banner") {
        const slides = getSlides().map((s) => ({
          ...s,
          cta_link: normalizeLink(s.cta_link),
          secondary_cta_link: normalizeLink(s.secondary_cta_link),
        }));
        finalContent.slides = slides;
        if (slides[0]) {
          finalContent.headline = slides[0].headline;
          finalContent.subtitle = slides[0].subtitle;
          finalContent.cta_text = slides[0].cta_text;
          finalContent.cta_link = slides[0].cta_link;
          finalContent.secondary_cta_text = slides[0].secondary_cta_text;
          finalContent.secondary_cta_link = slides[0].secondary_cta_link;
          finalContent.bg_image = slides[0].bg_image;
        }
      } else if (section.section_type === "occasion_strip") {
        finalContent.items = getOccasionItems().map((item) => ({
          ...item,
          href: normalizeLink(item.href),
        }));
        if (!finalContent.title) finalContent.title = "Shop by Occasion";
        if (!finalContent.subtitle) {
          finalContent.subtitle =
            "Thoughtfully curated palettes and cuts styled for life's special celebrations and effortless daily poise.";
        }
      } else if (section.section_type === "couture_spotlight") {
        if (typeof finalContent.cta_link === "string") {
          finalContent.cta_link = normalizeLink(finalContent.cta_link);
        }
      }

      const res = await updateHomepageSectionAction(section.id, {
        title,
        is_active: isActive,
        content: finalContent,
      });

      if (res.success) {
        const updatedSection: AdminHomepageSection = {
          ...section,
          title,
          is_active: isActive,
          content: finalContent,
          updated_at: new Date().toISOString(),
        };
        onSaved(res.message || "Section saved successfully.", updatedSection);
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
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <strong>Hero Carousel Slides:</strong> Manage all slides rotating on your storefront hero banner. Each slide features its own high-resolution image, tag capsule, headline, subtitle, and call-to-action buttons.
              </div>

              {/* Multi-Slide Carousel Manager */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Carousel Slides ({getSlides().length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Edit text, images, and buttons for each slide. Slide 1 serves as the primary initial banner.
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

                <div className="space-y-4">
                  {getSlides().map((slide, idx) => (
                    <div
                      key={slide.id || idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Slide {idx + 1}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Primary Banner
                            </span>
                          )}
                        </div>
                        {getSlides().length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove Slide ${idx + 1}?`)) {
                                handleRemoveSlide(idx);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Tag / Capsule Badge
                          </label>
                          <input
                            type="text"
                            value={slide.tag || ""}
                            onChange={(e) => handleUpdateSlide(idx, "tag", e.target.value)}
                            placeholder="e.g. Spring / Summer 2026"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Headline <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
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
                        <textarea
                          rows={2}
                          value={slide.subtitle || ""}
                          onChange={(e) => handleUpdateSlide(idx, "subtitle", e.target.value)}
                          placeholder="e.g. Effortless silhouettes, refined textures, and contemporary essentials..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Primary Button Text <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={slide.cta_text || ""}
                            onChange={(e) => handleUpdateSlide(idx, "cta_text", e.target.value)}
                            placeholder="e.g. Explore Collection"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Primary Button Link <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={slide.cta_link || ""}
                            onChange={(e) => handleUpdateSlide(idx, "cta_link", e.target.value)}
                            placeholder="e.g. /shop"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Secondary Button Text (Optional)
                          </label>
                          <input
                            type="text"
                            value={slide.secondary_cta_text || ""}
                            onChange={(e) => handleUpdateSlide(idx, "secondary_cta_text", e.target.value)}
                            placeholder="e.g. Kurtas & Sets"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Secondary Button Link (Optional)
                          </label>
                          <input
                            type="text"
                            value={slide.secondary_cta_link || ""}
                            onChange={(e) => handleUpdateSlide(idx, "secondary_cta_link", e.target.value)}
                            placeholder="e.g. /collections/kurtas-sets"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Slide Image */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Background Image <span className="text-rose-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {slide.bg_image ? (
                            <div className="relative aspect-[16/7] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <Image
                                src={slide.bg_image}
                                alt={`Slide ${idx + 1} preview`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Upload Image</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleSlideImageUpload(e, idx)}
                                disabled={isUploading}
                                className="hidden"
                              />
                            </label>
                            <span className="text-[11px] text-slate-400">or enter image URL below</span>
                          </div>

                          <p className="text-[10px] text-slate-400">
                            Recommended: 2000 × 850px (Landscape), JPG or WebP under 5MB.
                          </p>

                          <input
                            type="text"
                            required
                            value={slide.bg_image || ""}
                            onChange={(e) => handleUpdateSlide(idx, "bg_image", e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. OCCASION STRIP */}
          {section.section_type === "occasion_strip" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs leading-relaxed">
                <strong>Shop by Occasion:</strong> Curated styling cards that guide customers to distinct collections based on occasions (e.g. Festive, Workwear, Evening, Casual). Customize card titles, imagery, and destination links below.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Header Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={getString("title", "Shop by Occasion")}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="e.g. Shop by Occasion"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Subtitle
                </label>
                <textarea
                  rows={2}
                  value={getString(
                    "subtitle",
                    "Thoughtfully curated palettes and cuts styled for life's special celebrations and effortless daily poise."
                  )}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="e.g. Thoughtfully curated palettes and cuts..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Occasion Cards Manager */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Occasion Cards ({getOccasionItems().length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Manage each occasion card displayed on the storefront.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOccasion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Occasion Card</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {getOccasionItems().map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Card {idx + 1}: {item.name || "Untitled"}
                        </span>
                        {getOccasionItems().length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove '${item.name || `Card ${idx + 1}`}'?`)) {
                                handleRemoveOccasion(idx);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Occasion Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleUpdateOccasion(idx, "name", e.target.value)}
                            placeholder="e.g. Festive Capsule"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Subtitle / Tagline
                          </label>
                          <input
                            type="text"
                            value={item.subtitle}
                            onChange={(e) => handleUpdateOccasion(idx, "subtitle", e.target.value)}
                            placeholder="e.g. Zari, Silk Blends & Brocades"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Destination Link URL <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={item.href}
                          onChange={(e) => handleUpdateOccasion(idx, "href", e.target.value)}
                          placeholder="e.g. /collections/kurtas-sets"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>

                      {/* Card Image */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Card Image <span className="text-rose-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {item.image ? (
                            <div className="relative aspect-[4/5] max-w-[140px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                              <Image
                                src={item.image}
                                alt={item.name || "Occasion"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Upload Image</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleOccasionImageUpload(e, idx)}
                                disabled={isUploading}
                                className="hidden"
                              />
                            </label>
                            <span className="text-[11px] text-slate-400">or enter image URL below</span>
                          </div>

                          <p className="text-[10px] text-slate-400">
                            Recommended: 800 × 1000px (Portrait 4:5), JPG or WebP under 5MB.
                          </p>

                          <input
                            type="text"
                            required
                            value={item.image}
                            onChange={(e) => handleUpdateOccasion(idx, "image", e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. CATEGORY GRID */}
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
                  value={getString("subtitle", "Thoughtfully tailored pieces across modern everyday silhouettes.")}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="e.g. Thoughtfully tailored pieces across modern silhouettes."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Looking to manage category names, images, or slugs?</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Category tiles and imagery are managed dynamically in Catalog Categories.</p>
                </div>
                <Link
                  href="/admin/categories"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-colors shrink-0"
                >
                  <span>Manage Categories</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </Link>
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
                    value={getString("subtitle", "Handpicked styles from our collection.")}
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

              {/* Auto Mode: Product count limit & Catalog link */}
              {getString("mode", "auto") === "auto" && (
                <div className="space-y-3">
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

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900">
                    <div>
                      <span className="font-semibold text-amber-950">Managing &apos;Featured&apos; Products</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">Toggle the &apos;Featured&apos; flag on any product in your catalog to have it appear here automatically.</p>
                    </div>
                    <Link
                      href="/admin/products"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-50 shadow-xs transition-colors shrink-0"
                    >
                      <span>Manage Products</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                    </Link>
                  </div>
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
          )}

          {/* 4. COUTURE SPOTLIGHT (BRAND STORY & CRAFT) */}
          {section.section_type === "couture_spotlight" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <strong>Brand Craft Spotlight:</strong> This section conveys the slow fashion philosophy,
                artisanal textile heritage, and tailored poise of your brand.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Pill Label
                  </label>
                  <input
                    type="text"
                    value={getString("tagline", "Artisanal Craft & Slow Fashion")}
                    onChange={(e) => handleFieldChange("tagline", e.target.value)}
                    placeholder="e.g. Artisanal Craft & Slow Fashion"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={getString("headline", "Consciously Crafted. Designed for Everyday Grace.")}
                    onChange={(e) => handleFieldChange("headline", e.target.value)}
                    placeholder="e.g. Consciously Crafted. Designed for Everyday Grace."
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Narrative / Story Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={getString(
                    "description",
                    "At Velaash, we reject disposable seasonal trends. Every piece is envisioned as an heirloom essential — pairing the airy breathability of authentic Indian textiles with sleek, contemporary cuts that seamlessly carry you from boardroom poise to festive soirees."
                  )}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Enter brand craftsmanship and textile story..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Editorial Image Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Editorial Craftsmanship Image <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-3">
                  {getString("image_url") ? (
                    <div className="relative aspect-[4/5] max-w-[200px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                      <Image
                        src={getString("image_url")}
                        alt="Editorial preview"
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
                        onChange={(e) => handleImageUpload(e, "image_url")}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400">or enter image URL below</span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Recommended: 1200 × 1500px (Portrait 4:5), JPG or WebP under 5MB.
                  </p>

                  <input
                    type="text"
                    required
                    value={getString("image_url")}
                    onChange={(e) => handleFieldChange("image_url", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Floating Detail Badge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Floating Luxury Detail Badge
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Badge Title
                    </label>
                    <input
                      type="text"
                      value={getString("detail_badge_title", "The Velaash Touch")}
                      onChange={(e) => handleFieldChange("detail_badge_title", e.target.value)}
                      placeholder="e.g. The Velaash Touch"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={getString(
                        "detail_badge_text",
                        "Hand-finished hems, concealed seams, and breathable natural textiles curated for lasting poise."
                      )}
                      onChange={(e) => handleFieldChange("detail_badge_text", e.target.value)}
                      placeholder="e.g. Hand-finished hems..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Call to Action Label
                  </label>
                  <input
                    type="text"
                    value={getString("cta_text", "Explore The Full Catalog")}
                    onChange={(e) => handleFieldChange("cta_text", e.target.value)}
                    placeholder="e.g. Explore The Full Catalog"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Call to Action Link
                  </label>
                  <input
                    type="text"
                    value={getString("cta_link", "/shop")}
                    onChange={(e) => handleFieldChange("cta_link", e.target.value)}
                    placeholder="e.g. /shop"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. PATRON TESTIMONIALS */}
          {section.section_type === "testimonials" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section Headline
                  </label>
                  <input
                    type="text"
                    value={getString("headline", "Cherished by Our Patrons")}
                    onChange={(e) => handleFieldChange("headline", e.target.value)}
                    placeholder="e.g. Cherished by Our Patrons"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={getString(
                      "subtitle",
                      "Real experiences from women who celebrate everyday grace in our tailored silhouettes."
                    )}
                    onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                    placeholder="e.g. Real experiences..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Testimonials List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Patron Reviews ({getTestimonialItems().length})
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Display authentic reviews with verified buyer badges on your homepage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTestimonial}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Review</span>
                  </button>
                </div>

                {getTestimonialItems().length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-xs text-slate-500">
                      No customer reviews yet. Click &quot;Add Review&quot; to showcase feedback from your patrons.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getTestimonialItems().map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Review #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTestimonial(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Remove review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Customer Name
                            </label>
                            <input
                              type="text"
                              value={t.name || ""}
                              onChange={(e) => handleUpdateTestimonial(idx, "name", e.target.value)}
                              placeholder="e.g. Ananya Sharma"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              City / Location
                            </label>
                            <input
                              type="text"
                              value={t.location || ""}
                              onChange={(e) => handleUpdateTestimonial(idx, "location", e.target.value)}
                              placeholder="e.g. Mumbai"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Star Rating (1 - 5)
                            </label>
                            <select
                              value={t.rating || 5}
                              onChange={(e) =>
                                handleUpdateTestimonial(idx, "rating", Number(e.target.value))
                              }
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                            >
                              <option value={5}>★★★★★ (5 Stars)</option>
                              <option value={4}>★★★★☆ (4 Stars)</option>
                              <option value={3}>★★★☆☆ (3 Stars)</option>
                              <option value={2}>★★☆☆☆ (2 Stars)</option>
                              <option value={1}>★☆☆☆☆ (1 Star)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Silhouette / Product Mentioned (Optional)
                          </label>
                          <input
                            type="text"
                            value={t.product_name || ""}
                            onChange={(e) =>
                              handleUpdateTestimonial(idx, "product_name", e.target.value)
                            }
                            placeholder="e.g. Chanderi Anarkali Set"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Review Content
                          </label>
                          <textarea
                            rows={2}
                            value={t.review || ""}
                            onChange={(e) => handleUpdateTestimonial(idx, "review", e.target.value)}
                            placeholder="Customer review quote..."
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. TRUST / VALUE STRIP */}
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
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Image...</span>
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
