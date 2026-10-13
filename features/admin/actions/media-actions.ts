"use server";

import { revalidatePath } from "next/cache";
import type { FileObject } from "@supabase/storage-js";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  ensureProductImagesBucket,
  extractStoragePathFromUrl,
} from "../utils/storage";

export interface MediaItem {
  id: string;
  name: string;
  path: string;
  publicUrl: string;
  sizeBytes: number;
  formattedSize: string;
  createdAt: string;
  inUse: boolean;
  usedIn?: string;
}

export interface MediaGalleryData {
  items: MediaItem[];
  totalSizeBytes: number;
  formattedTotalSize: string;
  quotaSizeBytes: number; // 1GB on Free tier = 1,073,741,824 bytes
  percentUsed: number;
  totalCount: number;
  inUseCount: number;
  orphanCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const SUPABASE_FREE_TIER_QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB (1,073,741,824 bytes)

/**
 * Retrieves all files stored in the product-images bucket,
 * cross-referenced against active database records to identify orphans.
 */
export async function getMediaGalleryDataAction(): Promise<{
  success: boolean;
  data?: MediaGalleryData;
  error?: string;
}> {
  try {
    await requireAdmin("manage_products");
    await ensureProductImagesBucket();
    const adminClient = createAdminClient();

    // 1. Fetch file listings from Supabase Storage (both 'products/' subfolder and root)
    const { data: productFiles, error: listErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list("products", {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (listErr) {
      console.error("Storage list error:", listErr);
      return { success: false, error: "Failed to list media files from storage." };
    }

    const { data: rootFiles } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list("", {
        limit: 500,
        sortBy: { column: "created_at", order: "desc" },
      });

    // 2. Fetch in-use references from database
    const [
      { data: productImages },
      { data: categories },
      { data: homepageSections },
      { data: siteSettings },
    ] = await Promise.all([
      adminClient.from("product_images").select("image_url, products(name)"),
      adminClient.from("categories").select("image_url, name"),
      adminClient.from("homepage_sections").select("content"),
      adminClient.from("site_settings").select("value"),
    ]);

    // Map active paths/URLs to descriptive source labels
    const inUseMap = new Map<string, string>();

    // Index product images
    productImages?.forEach((pi) => {
      if (pi.image_url) {
        inUseMap.set(pi.image_url, `Product: ${(pi.products as { name?: string })?.name || "Product"}`);
        const path = extractStoragePathFromUrl(pi.image_url);
        if (path) inUseMap.set(path, `Product: ${(pi.products as { name?: string })?.name || "Product"}`);
      }
    });

    // Index category banners
    categories?.forEach((cat) => {
      if (cat.image_url) {
        inUseMap.set(cat.image_url, `Category: ${cat.name}`);
        const path = extractStoragePathFromUrl(cat.image_url);
        if (path) inUseMap.set(path, `Category: ${cat.name}`);
      }
    });

    // Index homepage sections JSON content
    const homepageContentStr = JSON.stringify(homepageSections || []);
    const siteSettingsStr = JSON.stringify(siteSettings || []);

    // 3. Assemble media items list
    const items: MediaItem[] = [];
    let totalSizeBytes = 0;

    const processFiles = (files: FileObject[] | null | undefined, prefix: string) => {
      if (!files) return;
      for (const f of files) {
        // Skip folders or placeholder files
        if (!f.id || f.name === ".emptyFolderPlaceholder" || !f.name.includes(".")) continue;

        const path = prefix ? `${prefix}/${f.name}` : f.name;
        const size = (f.metadata?.size as number) || 0;
        totalSizeBytes += size;

        const {
          data: { publicUrl },
        } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

        const isReferencedInJson =
          homepageContentStr.includes(f.name) || siteSettingsStr.includes(f.name);

        const inUse = inUseMap.has(publicUrl) || inUseMap.has(path) || isReferencedInJson;
        const usedIn = inUseMap.get(publicUrl) || inUseMap.get(path) || (isReferencedInJson ? "Homepage / Site Settings" : undefined);

        items.push({
          id: f.id,
          name: f.name,
          path,
          publicUrl,
          sizeBytes: size,
          formattedSize: formatBytes(size),
          createdAt: f.created_at || new Date().toISOString(),
          inUse,
          usedIn,
        });
      }
    };

    processFiles(productFiles, "products");
    processFiles(
      rootFiles?.filter((rf) => rf.name !== "products"),
      ""
    );

    const inUseCount = items.filter((i) => i.inUse).length;
    const orphanCount = items.length - inUseCount;
    const percentUsed = Math.min(100, Math.round((totalSizeBytes / SUPABASE_FREE_TIER_QUOTA_BYTES) * 1000) / 10);

    return {
      success: true,
      data: {
        items,
        totalSizeBytes,
        formattedTotalSize: formatBytes(totalSizeBytes),
        quotaSizeBytes: SUPABASE_FREE_TIER_QUOTA_BYTES,
        percentUsed,
        totalCount: items.length,
        inUseCount,
        orphanCount,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load media gallery.";
    return { success: false, error: msg };
  }
}

/**
 * Bulk or single deletion of files from Supabase Storage.
 */
export async function deleteMediaFilesAction(
  paths: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await requireAdmin("manage_products");
    if (!paths || paths.length === 0) {
      return { success: false, error: "No files specified for deletion." };
    }

    const adminClient = createAdminClient();
    const { error: deleteErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(paths);

    if (deleteErr) {
      console.error("Storage deletion error:", deleteErr);
      return { success: false, error: `Deletion failed: ${deleteErr.message}` };
    }

    revalidatePath("/admin/media");
    return {
      success: true,
      message: `Successfully removed ${paths.length} file(s) from storage.`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete files.";
    return { success: false, error: msg };
  }
}
