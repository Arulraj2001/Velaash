import { revalidateTag, revalidatePath } from "next/cache";

export interface RevalidateCatalogOptions {
  /**
   * Specific product slug(s) to revalidate at the PDP level (/products/[slug])
   */
  slugs?: string | string[] | null;
  /**
   * If true, also revalidates general listing / collection routes:
   * "/", "/shop", "/category", "/collections".
   * Only bust listings when a product's visible card state changes (price, name, thumbnail, active flag)
   * or when availability flips (in-stock <-> out-of-stock).
   */
  revalidateListings?: boolean;
  /**
   * If true, also revalidates admin pages:
   * "/admin/products", "/admin/dashboard".
   * NEVER set to true from customer actions!
   */
  revalidateAdmin?: boolean;
  /**
   * Specific data cache tags to bust. Default: ["products"]
   */
  tags?: ("products" | "reviews")[];
  /**
   * If true, warms the affected product pages in the background by fetching their URLs.
   */
  warm?: boolean;
}

/**
 * Warms the specified product pages by issuing an HTTP GET in the background.
 * Next.js ISR caches the rendered HTML, so subsequent visitor hits are instant cache hits.
 */
export function warmProductPages(slugs: (string | null | undefined)[]): void {
  try {
    const validSlugs = slugs.filter((s): s is string => Boolean(s && typeof s === "string"));
    if (validSlugs.length === 0) return;

    const baseUrl =
      process.env.DEPLOY_PRIME_URL ||
      process.env.URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://velaash.in");

    for (const slug of validSlugs) {
      const url = `${baseUrl.replace(/\/$/, "")}/products/${slug.trim()}`;
      fetch(url, {
        headers: { "x-isr-warm": "1" },
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Narrow, targeted revalidation of product catalog assets.
 * Respects strict architectural boundaries:
 * - Customer actions (checkout, cancel, review) never touch /admin/* paths.
 * - Storefront listing/homepage routes are only busted when card-visible attributes or availability changes.
 * - Expired order cleanup only triggers when inventory is actually released.
 */
export function revalidateProductCatalog(
  options?: string | string[] | RevalidateCatalogOptions | null
): void {
  try {
    let slugs: string[] = [];
    let revalidateListings = false;
    let revalidateAdmin = false;
    let tags: ("products" | "reviews")[] = ["products"];
    let shouldWarm = false;

    if (typeof options === "string") {
      slugs = [options];
    } else if (Array.isArray(options)) {
      slugs = options;
    } else if (options && typeof options === "object") {
      if (options.slugs) {
        slugs = Array.isArray(options.slugs) ? options.slugs : [options.slugs];
      }
      revalidateListings = Boolean(options.revalidateListings);
      revalidateAdmin = Boolean(options.revalidateAdmin);
      if (options.tags && options.tags.length > 0) {
        tags = options.tags;
      }
      shouldWarm = Boolean(options.warm);
    }

    // 1. Bust specific cache tags
    for (const tag of tags) {
      revalidateTag(tag, "max");
    }

    // 2. Revalidate affected individual product pages (PDP)
    for (const s of slugs) {
      if (s && typeof s === "string") {
        revalidatePath(`/products/${s.trim()}`);
      }
    }

    // 3. Revalidate storefront listing pages ONLY when visible card/availability changed
    if (revalidateListings) {
      revalidatePath("/shop");
      revalidatePath("/category", "layout");
      revalidatePath("/collections", "layout");
      revalidatePath("/");
    }

    // 4. Revalidate admin views ONLY when explicitly requested by admin actions
    if (revalidateAdmin) {
      revalidatePath("/admin/products");
      revalidatePath("/admin/dashboard");
    }

    // 5. Warm affected product pages if requested
    if (shouldWarm && slugs.length > 0) {
      warmProductPages(slugs);
    }
  } catch {
    // Graceful no-op when called outside a Next.js server request context (e.g. CLI scripts or unit tests)
  }
}
