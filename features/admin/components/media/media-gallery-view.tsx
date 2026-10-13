"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  HardDrive,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  FileQuestion,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import {
  getMediaGalleryDataAction,
  deleteMediaFilesAction,
  type MediaGalleryData,
  type MediaItem,
} from "../../actions/media-actions";

export function MediaGalleryView() {
  const [data, setData] = useState<MediaGalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "in_use" | "orphaned">("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMediaGalleryDataAction();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load media files.");
      }
    } catch {
      setError("An unexpected error occurred while loading media gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === "in_use") return item.inUse;
      if (activeTab === "orphaned") return !item.inUse;
      return true;
    });
  }, [data?.items, searchQuery, activeTab]);

  const toggleSelect = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const selectAllFiltered = () => {
    if (selectedPaths.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(filteredItems.map((i) => i.path));
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteSelected = async (pathsToDelete: string[]) => {
    if (pathsToDelete.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete ${pathsToDelete.length} image(s) from Supabase Storage? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    setActionMessage(null);
    try {
      const res = await deleteMediaFilesAction(pathsToDelete);
      if (res.success) {
        setActionMessage(res.message || "Files deleted successfully.");
        setSelectedPaths((prev) => prev.filter((p) => !pathsToDelete.includes(p)));
        await loadData();
      } else {
        setError(res.error || "Failed to delete files.");
      }
    } catch {
      setError("Failed to execute deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeAllOrphans = () => {
    if (!data) return;
    const orphanPaths = data.items.filter((i) => !i.inUse).map((i) => i.path);
    if (orphanPaths.length === 0) return;
    handleDeleteSelected(orphanPaths);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            Media Storage & Asset Gallery
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage Supabase Storage assets, monitor Free Tier quota, and purge unused images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action and Error Feedback */}
      {actionMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Free Tier Storage Quota Overview Card */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Storage Meter Card */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Supabase Free Tier Storage
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900">
                {data.formattedTotalSize} / 1,024 MB ({data.percentUsed}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  data.percentUsed > 90
                    ? "bg-rose-500"
                    : data.percentUsed > 70
                    ? "bg-amber-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${Math.max(2, data.percentUsed)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Limit: 1,000 MB (Free Plan)</span>
              <span>
                {Math.max(0, 1024 - Math.round(data.totalSizeBytes / (1024 * 1024)))} MB Remaining
              </span>
            </div>
          </div>

          {/* In-Use Files Stat */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                In-Use Images
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-heading">{data.inUseCount}</p>
            <p className="text-[11px] text-slate-400">Attached to active catalog items</p>
          </div>

          {/* Orphaned / Unused Files Stat */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-600">
                <FileQuestion className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Unused / Orphaned
                </span>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-900 font-heading">{data.orphanCount}</p>
              {data.orphanCount > 0 && (
                <button
                  type="button"
                  onClick={handlePurgeAllOrphans}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Purge All</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Not linked to any product or setting</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Files ({data?.totalCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("in_use")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === "in_use"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              In Use ({data?.inUseCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orphaned")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === "orphaned"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unused ({data?.orphanCount ?? 0})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Selection Toolbar */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium"
              >
                {selectedPaths.length === filteredItems.length && filteredItems.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>Select All Filtered ({filteredItems.length})</span>
              </button>
              {selectedPaths.length > 0 && (
                <span className="text-slate-400">| {selectedPaths.length} selected</span>
              )}
            </div>

            {selectedPaths.length > 0 && (
              <button
                type="button"
                onClick={() => handleDeleteSelected(selectedPaths)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedPaths.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">Scanning Supabase Storage bucket...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <HardDrive className="h-8 w-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No media files found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No images matching "${searchQuery}".`
              : activeTab === "orphaned"
              ? "All files in storage are currently linked to active catalog items. Storage is clean!"
              : "No images have been uploaded yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const isSelected = selectedPaths.includes(item.path);
            return (
              <div
                key={item.path}
                className={`group relative rounded-xl border bg-white overflow-hidden transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Image Thumbnail Container */}
                <div
                  className="relative aspect-square w-full bg-slate-50 cursor-pointer overflow-hidden"
                  onClick={() => toggleSelect(item.path)}
                >
                  <Image
                    src={item.publicUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    unoptimized
                  />

                  {/* Selection Checkbox (Top Left) */}
                  <div className="absolute top-2 left-2 z-10">
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center transition-colors shadow-2xs ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-black/40 text-transparent group-hover:text-white/60 hover:bg-black/60"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  </div>

                  {/* In-Use / Orphan Badge (Top Right) */}
                  <div className="absolute top-2 right-2 z-10">
                    {item.inUse ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs shadow-2xs">
                        In Use
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/90 text-white backdrop-blur-xs shadow-2xs">
                        Unused
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Details Footer */}
                <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">{item.formattedSize}</span>
                    <span className="truncate max-w-[80px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-slate-900 truncate" title={item.name}>
                    {item.name}
                  </p>

                  {item.usedIn && (
                    <p
                      className="text-[9px] text-emerald-700 truncate font-medium"
                      title={item.usedIn}
                    >
                      {item.usedIn}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.publicUrl)}
                      className="text-slate-400 hover:text-indigo-600 p-1 rounded"
                      title="Copy Public URL"
                    >
                      {copiedUrl === item.publicUrl ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                      title="View full preview"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSelected([item.path])}
                      disabled={isDeleting}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {previewItem.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewItem.formattedSize} • {new Date(previewItem.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-video max-h-[400px] w-full bg-slate-50 rounded-xl overflow-hidden">
              <Image
                src={previewItem.publicUrl}
                alt={previewItem.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  previewItem.inUse
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {previewItem.inUse
                  ? `Linked: ${previewItem.usedIn || "In Use"}`
                  : "Unlinked / Orphaned"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(previewItem.publicUrl)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteSelected([previewItem.path]);
                    setPreviewItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
