"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
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
  Sliders,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import type { AdminHomepageSection } from "../../types/homepage";
import { SectionSortableRow } from "./section-sortable-row";
import { SectionEditModal } from "./section-edit-modal";
import { SectionAddModal } from "./section-add-modal";
import {
  reorderHomepageSectionsAction,
  toggleHomepageSectionActiveAction,
  deleteHomepageSectionAction,
} from "../../actions/homepage-actions";
import type { ProductListItem } from "@/features/products";

interface HomepageBuilderViewProps {
  initialSections: AdminHomepageSection[];
  allProducts: ProductListItem[];
}

export function HomepageBuilderView({
  initialSections,
  allProducts,
}: HomepageBuilderViewProps) {
  const [sections, setSections] = useState<AdminHomepageSection[]>(initialSections);
  const [editingSection, setEditingSection] = useState<AdminHomepageSection | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<AdminHomepageSection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Drag End handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((item) => item.id === active.id);
    const newIndex = sections.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically reorder in state
    const newOrder = arrayMove(sections, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setSections(newOrder);

    startTransition(async () => {
      const updates = newOrder.map((item) => ({
        id: item.id,
        display_order: item.display_order,
      }));

      const res = await reorderHomepageSectionsAction(updates);
      if (res.success) {
        showToast("Homepage section order saved successfully.");
      } else {
        setErrorMessage(res.error || "Failed to update section order.");
        // Rollback on failure
        setSections(sections);
      }
    });
  };

  // Toggle active handler
  const handleToggleActive = async (target: AdminHomepageSection) => {
    const nextActive = !target.is_active;

    // Optimistic update
    setSections((prev) =>
      prev.map((s) => (s.id === target.id ? { ...s, is_active: nextActive } : s))
    );

    startTransition(async () => {
      const res = await toggleHomepageSectionActiveAction(target.id, nextActive);
      if (res.success) {
        showToast(`Section is now ${nextActive ? "active" : "hidden"}.`);
      } else {
        setErrorMessage(res.error || "Failed to toggle section status.");
        // Rollback
        setSections((prev) =>
          prev.map((s) => (s.id === target.id ? { ...s, is_active: target.is_active } : s))
        );
      }
    });
  };

  // Delete section confirmation & execution
  const handleDeleteConfirm = async () => {
    if (!sectionToDelete || isDeleting) return;
    const targetId = sectionToDelete.id;
    setIsDeleting(true);

    try {
      const res = await deleteHomepageSectionAction(targetId);
      if (res.success) {
        setSections((prev) => {
          const remaining = prev.filter((s) => s.id !== targetId);
          return remaining.map((s, idx) => ({ ...s, display_order: idx + 1 }));
        });
        setSectionToDelete(null);
        showToast("Section deleted successfully.");
      } else {
        setErrorMessage(res.error || "Failed to delete section.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete section.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-900 text-white rounded-xl shadow-xl animate-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
                Homepage Builder
              </h1>
              <p className="text-xs text-slate-500">
                Drag to reorder sections, customize merchandising content, or toggle visibility.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Live Preview Button */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <span>Live Preview</span>
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </Link>

          {/* Add Section Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Helper Callout */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-semibold">Drag-to-Reorder Storefront Sections:</span> Grip any section’s
          left handle and move it up or down. The display order updates immediately on your live storefront.
          You can toggle sections on/off, or click Edit to customize headlines, images, and curated products.
        </div>
      </div>

      {/* Sections Sortable List */}
      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SectionSortableRow
                key={section.id}
                section={section}
                onEdit={(sec) => setEditingSection(sec)}
                onDelete={(sec) => setSectionToDelete(sec)}
                onToggleActive={handleToggleActive}
              />
            ))}
          </SortableContext>
        </DndContext>

        {sections.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No homepage sections found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &apos;Add Section&apos; above to add hero banners, product grids, or trust strips to your storefront.
            </p>
          </div>
        )}
      </div>

      {/* Edit Section Modal */}
      <SectionEditModal
        section={editingSection}
        isOpen={Boolean(editingSection)}
        onClose={() => setEditingSection(null)}
        onSaved={(msg, updatedSection) => {
          showToast(msg);
          // Reload local state with the newly updated section
          if (updatedSection) {
            setSections((prev) =>
              prev.map((s) => (s.id === updatedSection.id ? updatedSection : s))
            );
          }
          setEditingSection(null);
        }}
        allProducts={allProducts}
      />

      {/* Add Section Modal */}
      <SectionAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingTypes={sections.map((s) => s.section_type)}
        onAdded={(msg) => {
          showToast(msg);
          window.location.reload();
        }}
      />

      {/* Delete Confirmation Modal */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Delete Homepage Section?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-slate-700">{sectionToDelete.title || sectionToDelete.section_type}</strong>?
              This will remove it from the live storefront immediately.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSectionToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
