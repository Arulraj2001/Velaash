"use server";

import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { processAndUploadImage } from "../utils/image-processor";

/**
 * Server action to upload a single product image to Supabase Storage.
 * Permission: manage_products (Owner only).
 * Authoritative Sharp optimization: auto-rotate, strip EXIF, max 1600px, WebP, companion 400px thumbnail.
 */
export async function uploadProductImageAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  thumbnailUrl?: string;
  sizeBytes?: number;
  error?: string;
}> {
  try {
    await requireAdmin("manage_products");

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    const result = await processAndUploadImage({
      file,
      folder: "products",
      profile: "product",
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      url: result.url,
      path: result.path,
      thumbnailUrl: result.thumbnailUrl,
      sizeBytes: result.sizeBytes,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Upload authorization failed.";
    return { success: false, error: msg };
  }
}
