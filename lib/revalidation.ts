import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Revalidates product tags and paths across the storefront and admin panels.
 * Ensures that stock changes, review submissions, order cancellations, and price updates
 * immediately bust CDN and RSC caches for both the catalog and individual product pages.
 *
 * @param slugs Optional product slug or array of product slugs to bust targeted PDP paths
 */
export function revalidateProductCatalog(slugs?: string | string[] | null): void {
  try {
    // Bust tag-based ISR cache entries for products and reviews
    revalidateTag("products", "max");
    revalidateTag("reviews", "max");

    // Revalidate storefront listing pages
    revalidatePath("/shop");
    revalidatePath("/category", "layout");
    revalidatePath("/collections", "layout");
    revalidatePath("/");

    // Revalidate admin views
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");

    // Revalidate individual product pages if slugs provided
    if (slugs) {
      const slugList = Array.isArray(slugs) ? slugs : [slugs];
      for (const s of slugList) {
        if (s && typeof s === "string") {
          revalidatePath(`/products/${s.trim()}`);
        }
      }
    }
  } catch {
    // Graceful no-op when called outside a Next.js server request context (e.g. CLI scripts or unit tests)
  }
}
