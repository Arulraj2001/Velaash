"use client";

import React, { useState } from "react";
import {
  X,
  Sliders,
  FolderTree,
  Sparkles,
  ShieldCheck,
  Mail,
  Heart,
  Loader2,
  AlertCircle,
  Plus,
  LucideIcon,
} from "lucide-react";
import type { HomepageSectionKind } from "../../types/homepage";
import { createHomepageSectionAction } from "../../actions/homepage-actions";

interface SectionAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (msg: string) => void;
}

const AVAILABLE_SECTIONS: {
  type: HomepageSectionKind;
  title: string;
  badge: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    type: "hero_banner",
    title: "Hero Banner",
    badge: "Primary Visual",
    description: "High-impact editorial image banner with headline, subtitle, and primary call-to-action button.",
    icon: Sliders,
  },
  {
    type: "occasion_strip",
    title: "Shop by Occasion",
    badge: "Navigation",
    description: "Curated styling cards (Festive, Workwear, Evening, Casual) with custom images and links.",
    icon: Sparkles,
  },
  {
    type: "category_grid",
    title: "Category Tiles",
    badge: "Navigation",
    description: "Multi-column category grid connecting customers to your active catalog collections.",
    icon: FolderTree,
  },
  {
    type: "featured_products",
    title: "Featured Products",
    badge: "Merchandising",
    description: "Product showcase grid supporting automatic selection or custom hand-curated ordering.",
    icon: Sparkles,
  },
  {
    type: "couture_spotlight",
    title: "The Craft of Velaash",
    badge: "Brand Story",
    description: "Artisanal heritage spotlight showcasing slow fashion, natural textiles, and hand-touched details.",
    icon: Sparkles,
  },
  {
    type: "testimonials",
    title: "Patron Testimonials",
    badge: "Social Proof",
    description: "Verified customer reviews and ratings celebrating everyday grace in your tailored silhouettes.",
    icon: Heart,
  },
  {
    type: "value_strip",
    title: "Trust & Value Strip",
    badge: "Guarantees",
    description: "4-column reassurance strip showcasing shipping, exchange, and security commitments.",
    icon: ShieldCheck,
  },
  {
    type: "newsletter",
    title: "Newsletter Signup",
    badge: "Marketing",
    description: "Engaging subscription section encouraging customer email signups for arrivals & offers.",
    icon: Mail,
  },
];

export function SectionAddModal({ isOpen, onClose, onAdded }: SectionAddModalProps) {
  const [selectedType, setSelectedType] = useState<HomepageSectionKind>("hero_banner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await createHomepageSectionAction(selectedType);

      if (res.success) {
        onAdded("Section added successfully.");
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to add section.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to add section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">
              Add Homepage Section
            </h2>
            <p className="text-xs text-slate-500">
              Select one of the supported storefront section types to add to your homepage.
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

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {AVAILABLE_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = selectedType === sec.type;

              return (
                <div
                  key={sec.type}
                  onClick={() => setSelectedType(sec.type)}
                  className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-amber-100 border-amber-300 text-amber-900"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {sec.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Selected Section</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
