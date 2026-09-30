"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  FolderTree,
  Plus,
  Search,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import type { AdminCategoryItem } from "../types/categories";
import { CategorySortableRow } from "./category-sortable-row";
import { CategoryFormModal } from "./category-form-modal";
import { CategoryDeleteModal } from "./category-delete-modal";
import {
  reorderCategoriesAction,
  toggleCategoryActiveAction,
} from "../actions/category-actions";

interface CategoryTreeViewProps {
  initialTree: AdminCategoryItem[];
  topLevelCategories: { id: string; name: string; slug: string }[];
  isOwner: boolean;
}

export function CategoryTreeView({
  initialTree,
  topLevelCategories,
  isOwner,
}: CategoryTreeViewProps) {
  const router = useRouter();
  const [tree, setTree] = useState<AdminCategoryItem[]>(initialTree);
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryItem | null>(null);
  const [parentPresetId, setParentPresetId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Drag and drop reordering handler
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isOwner) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1. Check if dragging a top-level category
    const topIndexActive = tree.findIndex((c) => c.id === active.id);
    const topIndexOver = tree.findIndex((c) => c.id === over.id);

    if (topIndexActive !== -1 && topIndexOver !== -1) {
      const reordered = arrayMove(tree, topIndexActive, topIndexOver).map(
        (cat, idx) => ({
          ...cat,
          display_order: idx + 1,
        })
      );

      setTree(reordered);

      const updates = reordered.map((cat) => ({
        id: cat.id,
        display_order: cat.display_order,
      }));

      const res = await reorderCategoriesAction(updates);
      if (res.success) {
        showToast("Top-level display order updated.");
        handleRefresh();
      }
      return;
    }

    // 2. Check if dragging within sub-categories of any parent
    for (let pIdx = 0; pIdx < tree.length; pIdx++) {
      const parent = tree[pIdx];
      const subs = parent.subcategories || [];
      const subIdxActive = subs.findIndex((s) => s.id === active.id);
      const subIdxOver = subs.findIndex((s) => s.id === over.id);

      if (subIdxActive !== -1 && subIdxOver !== -1) {
        const reorderedSubs = arrayMove(subs, subIdxActive, subIdxOver).map(
          (sub, idx) => ({
            ...sub,
            display_order: idx + 1,
          })
        );

        const newTree = [...tree];
        newTree[pIdx] = {
          ...parent,
          subcategories: reorderedSubs,
        };

        setTree(newTree);

        const updates = reorderedSubs.map((sub) => ({
          id: sub.id,
          display_order: sub.display_order,
        }));

        const res = await reorderCategoriesAction(updates);
        if (res.success) {
          showToast(`Sub-categories of "${parent.name}" reordered.`);
          handleRefresh();
        }
        return;
      }
    }
  };

  // Toggle active status
  const handleToggleStatus = async (cat: AdminCategoryItem) => {
    if (!isOwner) return;
    const newStatus = !cat.is_active;

    // Optimistic UI update
    setTree((prev) =>
      prev.map((parent) => {
        if (parent.id === cat.id) {
          return { ...parent, is_active: newStatus };
        }
        return {
          ...parent,
          subcategories: (parent.subcategories || []).map((sub) =>
            sub.id === cat.id ? { ...sub, is_active: newStatus } : sub
          ),
        };
      })
    );

    const res = await toggleCategoryActiveAction(cat.id, newStatus);
    if (res.success) {
      showToast(
        `"${cat.name}" is now ${newStatus ? "Active" : "Inactive"}.`
      );
      handleRefresh();
    }
  };

  // Open Create Top-Level Category modal
  const handleAddTopLevel = () => {
    setSelectedCategory(null);
    setParentPresetId(null);
    setIsFormModalOpen(true);
  };

  // Open Create Sub-Category modal with parent preselected
  const handleAddSubcategory = (parentCat: AdminCategoryItem) => {
    setSelectedCategory(null);
    setParentPresetId(parentCat.id);
    setIsFormModalOpen(true);
  };

  // Open Edit modal
  const handleEditCategory = (cat: AdminCategoryItem) => {
    setSelectedCategory(cat);
    setParentPresetId(cat.parent_id);
    setIsFormModalOpen(true);
  };

  // Open Delete modal
  const handleDeleteCategory = (cat: AdminCategoryItem) => {
    setCategoryToDelete(cat);
  };

  // Filter tree by search query
  const query = searchQuery.toLowerCase().trim();
  const filteredTree: AdminCategoryItem[] = query
    ? tree
        .filter((parent) => {
          const parentMatches =
            parent.name.toLowerCase().includes(query) ||
            parent.slug.toLowerCase().includes(query);
          const hasMatchingSubs = (parent.subcategories || []).some(
            (sub) =>
              sub.name.toLowerCase().includes(query) ||
              sub.slug.toLowerCase().includes(query)
          );
          return parentMatches || hasMatchingSubs;
        })
        .map((parent) => {
          const parentMatches =
            parent.name.toLowerCase().includes(query) ||
            parent.slug.toLowerCase().includes(query);
          if (parentMatches) return parent;
          return {
            ...parent,
            subcategories: (parent.subcategories || []).filter(
              (sub) =>
                sub.name.toLowerCase().includes(query) ||
                sub.slug.toLowerCase().includes(query)
            ),
          };
        })
    : tree;

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Staff Read-Only Banner */}
      {!isOwner && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Staff permissions: Read-only access to categories. Creating, editing,
            reordering, and deleting taxonomies requires store owner authorization.
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by category name or slug..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={handleAddTopLevel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Categories Tree Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Table Column Headers */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-6 text-center">#</span>
            <span className="w-10"></span>
            <span>Category Taxonomy</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-right">
            <span className="w-24 text-right">Active Stock</span>
            <span className="w-16 text-center">Order</span>
            <span className="w-20 text-center">Status</span>
          </div>

          <div className="w-32 text-right">
            <span>Actions</span>
          </div>
        </div>

        {/* Tree Rows with Drag-and-Drop */}
        {filteredTree.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderTree className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-700">No categories found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery
                ? `No categories match query "${searchQuery}"`
                : "Create your first category to organize your catalog."}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* Top-Level Context */}
            <SortableContext
              items={filteredTree.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTree.map((parent) => (
                <div key={parent.id} className="border-b last:border-b-0 border-slate-100">
                  {/* Top-Level Category Row */}
                  <CategorySortableRow
                    category={parent}
                    isSubcategory={false}
                    isOwner={isOwner}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onAddSubcategory={handleAddSubcategory}
                    onToggleStatus={handleToggleStatus}
                  />

                  {/* Nested Sub-Categories */}
                  {parent.subcategories && parent.subcategories.length > 0 && (
                    <SortableContext
                      items={parent.subcategories.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="divide-y divide-slate-100 bg-slate-50/20">
                        {parent.subcategories.map((sub) => (
                          <CategorySortableRow
                            key={sub.id}
                            category={sub}
                            isSubcategory={true}
                            isOwner={isOwner}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                            onToggleStatus={handleToggleStatus}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add / Edit Category Form Modal */}
      {isFormModalOpen && (
        <CategoryFormModal
          key={selectedCategory?.id || parentPresetId || "new"}
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          initialData={selectedCategory}
          parentCategoryIdPreset={parentPresetId}
          topLevelCategories={topLevelCategories}
          onSuccess={() => {
            handleRefresh();
          }}
        />
      )}

      {/* Delete Safeguard Modal */}
      <CategoryDeleteModal
        isOpen={Boolean(categoryToDelete)}
        category={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onSuccess={() => {
          showToast("Category successfully deleted.");
          handleRefresh();
        }}
      />
    </div>
  );
}
