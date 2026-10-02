"use client";

import React, { useState } from "react";
import {
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
  Layers,
} from "lucide-react";
import type { HomepageSectionKind } from "../../types/homepage";
import { createHomepageSectionAction } from "../../actions/homepage-actions";
import { AdminModal } from "../admin-modal";

interface SectionAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (msg: string) => void;
  existingTypes?: HomepageSectionKind[];
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

export function SectionAddModal({
  isOpen,
  onClose,
  onAdded,
  existingTypes = [],
}: SectionAddModalProps) {
  const existingSet = React.useMemo(() => new Set(existingTypes), [existingTypes]);
  const availableTypes = AVAILABLE_SECTIONS.filter((s) => !existingSet.has(s.type));
  const isAllAdded = availableTypes.length === 0;

  const [selectedType, setSelectedType] = useState<HomepageSectionKind>(() => {
    return availableTypes[0]?.type || "hero_banner";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (existingSet.has(selectedType) && availableTypes.length > 0) {
      const fallback = availableTypes[0].type;
      queueMicrotask(() => setSelectedType(fallback));
    }
  }, [existingSet, selectedType, availableTypes]);

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

  const footerActions = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isSubmitting || isAllAdded}
        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 shadow-sm transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Adding...</span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Selected Section</span>
          </>
        )}
      </button>
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      icon={<Layers className="w-5 h-5 text-indigo-600" />}
      title="Add Homepage Section"
      description="Select one of the supported storefront section types to add to your homepage."
      footer={footerActions}
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {isAllAdded && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All 8 storefront sections are already present in your homepage builder. You can customize, reorder, or toggle visibility for any section directly on the main page.
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {AVAILABLE_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isAlreadyAdded = existingSet.has(sec.type);
            const isSelected = selectedType === sec.type && !isAlreadyAdded;

            return (
              <div
                key={sec.type}
                onClick={() => {
                  if (!isAlreadyAdded) setSelectedType(sec.type);
                }}
                className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  isAlreadyAdded
                    ? "border-slate-200/70 bg-slate-50/70 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-2xs cursor-pointer"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isAlreadyAdded
                      ? "bg-slate-100 border-slate-200 text-slate-400"
                      : isSelected
                      ? "bg-indigo-100 border-indigo-200 text-indigo-700"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-slate-900">{sec.title}</h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {sec.badge}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        In Builder
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminModal>
  );
}
