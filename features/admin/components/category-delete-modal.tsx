"use client";

import React, { useTransition, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Ban,
  AlertCircle,
  EyeOff,
  Trash2,
} from "lucide-react";
import type { AdminCategoryItem } from "../types/categories";
import {
  deleteCategoryAction,
  toggleCategoryActiveAction,
} from "../actions/category-actions";
import { AdminModal } from "./admin-modal";

interface CategoryDeleteModalProps {
  category: AdminCategoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDeleteModal({
  category,
  isOpen,
  onClose,
  onSuccess,
}: CategoryDeleteModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const productsCount = category.product_count || 0;
  const subCategoriesCount = category.subcategories?.length || 0;

  const hasProducts = productsCount > 0;
  const hasSubCategories = subCategoriesCount > 0;
  const isDeletionBlocked = hasProducts || hasSubCategories;

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteCategoryAction(category.id);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to delete category.");
      }
    });
  };

  const handleDeactivate = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await toggleCategoryActiveAction(category.id, false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to deactivate category.");
      }
    });
  };

  const footerActions = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
      >
        Cancel
      </button>

      {isDeletionBlocked ? (
        <button
          type="button"
          onClick={handleDeactivate}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          <span>Deactivate Category Instead</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span>Delete Permanently</span>
        </button>
      )}
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      icon={
        isDeletionBlocked ? (
          <Ban className="h-5 w-5 text-amber-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        )
      }
      title={isDeletionBlocked ? "Deletion Safeguard Active" : "Delete Category"}
      description={category.name}
      footer={footerActions}
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {isDeletionBlocked ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-2 text-amber-900">
              <div className="font-bold text-xs flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Cannot Delete Category</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 ml-1">
                {hasProducts && (
                  <li>
                    This category has{" "}
                    <strong>
                      {productsCount} assigned product
                      {productsCount === 1 ? "" : "s"}
                    </strong>
                    . Reassign or delete them first.
                  </li>
                )}
                {hasSubCategories && (
                  <li>
                    This category has{" "}
                    <strong>
                      {subCategoriesCount} sub-category
                      {subCategoriesCount === 1 ? "" : "ies"}
                    </strong>
                    . Delete or reassign all sub-categories first.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5 text-slate-700">
              <span className="font-bold text-[11px] text-slate-900 block">
                Recommended Action: Deactivate Instead
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Deactivating this category immediately hides it and its products from
                store navigation and search results while preserving your catalog and order history intact.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-slate-600">
            <p className="leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 font-semibold">{category.name}</strong>?
            </p>
            <p className="text-[11px] text-slate-500">
              This category has 0 assigned products and 0 sub-categories. This action cannot be undone.
            </p>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
