"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  CornerDownRight,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Ruler,
} from "lucide-react";
import type { AdminCategoryItem } from "../types/categories";

interface CategorySortableRowProps {
  category: AdminCategoryItem;
  isSubcategory?: boolean;
  isOwner: boolean;
  onEdit: (cat: AdminCategoryItem) => void;
  onDelete: (cat: AdminCategoryItem) => void;
  onAddSubcategory?: (parentCat: AdminCategoryItem) => void;
  onToggleStatus: (cat: AdminCategoryItem) => void;
}

export function CategorySortableRow({
  category,
  isSubcategory = false,
  isOwner,
  onEdit,
  onDelete,
  onAddSubcategory,
  onToggleStatus,
}: CategorySortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled: !isOwner,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 transition-colors hover:bg-slate-50/70 ${
        isSubcategory ? "pl-11 bg-slate-50/30" : ""
      }`}
    >
      {/* Left: Drag Handle, Visual Connector, Image, Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle */}
        {isOwner ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            suppressHydrationWarning
            className="cursor-grab text-slate-300 hover:text-slate-600 focus:outline-none active:cursor-grabbing p-1"
            title="Drag to reorder display order"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Tree Connector for Subcategories */}
        {isSubcategory && (
          <CornerDownRight className="h-4 w-4 text-slate-300 shrink-0 -ml-2" />
        )}

        {/* Image Thumbnail */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-slate-400" />
          )}
        </div>

        {/* Name and Slug */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium truncate ${
                isSubcategory ? "text-xs text-slate-800" : "text-sm text-slate-900 font-semibold"
              }`}
            >
              {category.name}
            </span>

            {/* Sub-category Count Pill (for top-level only) */}
            {!isSubcategory && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {category.subcategories?.length ?? 0} sub-categories
              </span>
            )}

            {/* Size Chart Badge */}
            {category.size_chart && (
              <span
                className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700"
                title={`Default size chart: ${category.size_chart.name}`}
              >
                <Ruler className="h-2.5 w-2.5" />
                <span>Size Chart</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
            <code className="text-slate-400 font-mono text-[10px]">
              /{category.slug}
            </code>
            {category.description && (
              <>
                <span>•</span>
                <span className="truncate max-w-xs">{category.description}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Product Count & Display Order */}
      <div className="flex items-center gap-4 shrink-0 text-xs">
        {/* Active Products Count */}
        <div className="text-right w-24">
          <Link
            href={`/admin/products?category=${category.id}`}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              category.product_count > 0
                ? "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            }`}
            title={`View products in ${category.name}`}
          >
            {category.product_count} product{category.product_count === 1 ? "" : "s"}
          </Link>
        </div>

        {/* Display Order */}
        <div className="text-center w-16">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
            #{category.display_order}
          </span>
        </div>

        {/* Status Badge / Quick Toggle */}
        <div className="w-20 text-center">
          {isOwner ? (
            <button
              type="button"
              onClick={() => onToggleStatus(category)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                category.is_active
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              title="Click to toggle status"
            >
              {category.is_active ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  <span>Inactive</span>
                </>
              )}
            </button>
          ) : (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                category.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {category.is_active ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1 w-32 shrink-0">
        {isOwner && (
          <>
            {/* Add Sub-category (Top-level only) */}
            {!isSubcategory && onAddSubcategory && (
              <button
                type="button"
                onClick={() => onAddSubcategory(category)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                title="Add Sub-category to this parent"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Edit category"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete category"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
