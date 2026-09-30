"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  FolderTree,
  Sparkles,
  ShieldCheck,
  Mail,
  Heart,
  LucideIcon,
} from "lucide-react";
import type { AdminHomepageSection, HomepageSectionKind } from "../../types/homepage";

const SECTION_TYPE_CONFIG: Record<
  HomepageSectionKind,
  { label: string; description: string; icon: LucideIcon; badgeColor: string }
> = {
  hero_banner: {
    label: "Hero Banner",
    description: "Primary visual headline, value proposition, and CTA banner",
    icon: Sliders,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  category_grid: {
    label: "Category Tiles",
    description: "Visual grid linking to live collection categories",
    icon: FolderTree,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  featured_products: {
    label: "Featured Products",
    description: "Curated product showcase (auto-flagged or custom curated)",
    icon: Sparkles,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  couture_spotlight: {
    label: "Brand Story & Craft",
    description: "The Craft of Velaash editorial spotlight with storytelling, imagery, and pillars",
    icon: Sparkles,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  testimonials: {
    label: "Patron Testimonials",
    description: "Verified customer reviews, ratings, and testimonials showcasing buyer trust",
    icon: Heart,
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
  },
  value_strip: {
    label: "Trust & Value Strip",
    description: "4-column guarantee and reassurance badges (shipping, returns, payments)",
    icon: ShieldCheck,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  newsletter: {
    label: "Newsletter Signup",
    description: "Customer email acquisition banner for updates and promotions",
    icon: Mail,
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
  },
};

interface SectionSortableRowProps {
  section: AdminHomepageSection;
  onEdit: (section: AdminHomepageSection) => void;
  onDelete: (section: AdminHomepageSection) => void;
  onToggleActive: (section: AdminHomepageSection) => void;
  isUpdating?: boolean;
}

export function SectionSortableRow({
  section,
  onEdit,
  onDelete,
  onToggleActive,
  isUpdating = false,
}: SectionSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const typeConfig = SECTION_TYPE_CONFIG[section.section_type] || {
    label: section.section_type,
    description: "Custom homepage section",
    icon: Sliders,
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const Icon = typeConfig.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border bg-white shadow-xs transition-all ${
        isDragging
          ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
          : section.is_active
          ? "border-slate-200 hover:border-slate-300"
          : "border-slate-200/60 bg-slate-50/70 opacity-75"
      }`}
    >
      {/* Left: Drag Handle & Info */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder section"
          className="cursor-grab active:cursor-grabbing p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Display Order Pill */}
        <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200">
          {section.display_order}
        </span>

        {/* Section Icon & Type Badge */}
        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        {/* Title & Description */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-base font-semibold text-slate-900 truncate">
              {section.title || typeConfig.label}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${typeConfig.badgeColor}`}
            >
              {typeConfig.label}
            </span>
            {!section.is_active && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-700">
                Hidden
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {typeConfig.description}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Active Toggle Switch */}
        <button
          type="button"
          onClick={() => onToggleActive(section)}
          disabled={isUpdating}
          aria-label={section.is_active ? "Hide section on homepage" : "Show section on homepage"}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            section.is_active
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
        >
          {section.is_active ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Active</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Hidden</span>
            </>
          )}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(section)}
          disabled={isUpdating}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Edit section content"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(section)}
          disabled={isUpdating}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
          title="Delete section"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
