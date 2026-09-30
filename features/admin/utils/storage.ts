import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Ensures the product-images bucket is provisioned as a public storage bucket.
 */
export async function ensureProductImagesBucket() {
  const adminClient = createAdminClient();
  const { data: buckets, error: listErr } = await adminClient.storage.listBuckets();

  if (listErr) {
    console.error("Failed to list storage buckets:", listErr);
    return;
  }

  const exists = buckets?.some((b) => b.name === PRODUCT_IMAGES_BUCKET);
  if (!exists) {
    const { error: createErr } = await adminClient.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    });

    if (createErr) {
      console.error("Failed to create product-images bucket:", createErr);
    }
  }
}

/**
 * Extracts storage file path from a full public Supabase storage URL.
 * Example URL:
 * https://xyz.supabase.co/storage/v1/object/public/product-images/products/abc.webp
 * Returns: "products/abc.webp"
 */
export function extractStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

/**
 * Deletes orphaned image files from Supabase Storage.
 */
export async function deleteProductImagesFromStorage(imageUrlsOrPaths: string[]): Promise<void> {
  if (!imageUrlsOrPaths || imageUrlsOrPaths.length === 0) return;

  const paths = imageUrlsOrPaths
    .map((item) => (item.startsWith("http") ? extractStoragePathFromUrl(item) : item))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const adminClient = createAdminClient();
  const { error } = await adminClient.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) {
    console.warn("Notice: Could not delete orphaned storage images:", error.message);
  }
}
