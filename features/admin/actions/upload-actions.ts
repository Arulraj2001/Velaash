"use server";

import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  ensureProductImagesBucket,
} from "../utils/storage";

/**
 * Server action to upload a single product image to Supabase Storage.
 * Permission: manage_products (Owner only).
 */
export async function uploadProductImageAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}> {
  try {
    await requireAdmin("manage_products");

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload a JPG, PNG, or WebP image.",
      };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        error: "File size exceeds the 5MB maximum limit.",
      };
    }

    await ensureProductImagesBucket();
    const adminClient = createAdminClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `products/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("Storage upload failed:", uploadErr);
      return { success: false, error: "Failed to upload image to storage." };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

    return {
      success: true,
      url: publicUrl,
      path: storagePath,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Upload authorization failed.";
    return { success: false, error: msg };
  }
}
