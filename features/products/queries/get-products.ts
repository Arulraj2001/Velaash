import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  ProductListItem,
  ProductFilterParams,
  ProductQueryResult,
  ProductCategoryMetadata,
  AvailableFiltersFacet,
  RawDbProduct,
} from "../types";

const PAGE_SIZE_DEFAULT = 12;

const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  base_price,
  compare_at_price,
  has_variants,
  stock_quantity,
  specifications,
  created_at,
  is_active,
  is_featured,
  stock_status,
  category_id,
  free_shipping_active,
  free_shipping_start,
  free_shipping_end,
  free_shipping_badge_text,
  categories (
    id,
    name,
    slug,
    parent_id
  ),
  product_variants (
    id,
    size,
    color,
    color_hex,
    stock_quantity,
    sku,
    price_override,
    is_active
  ),
  product_images (
    id,
    image_url,
    alt_text,
    display_order,
    is_primary,
    variant_id
  ),
  reviews (
    rating,
    is_approved
  )
`;

/**
 * Helper to compute available filter facets across all matching category inventory
 */
function computeAvailableFilters(allProducts: ProductListItem[]): AvailableFiltersFacet {
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>();
  const sizeMap = new Map<string, number>();
  const colorMap = new Map<string, { hex: string; count: number }>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const product of allProducts) {
    if (product.category_slug && product.category_name) {
      const existing = categoryMap.get(product.category_slug);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(product.category_slug, {
          name: product.category_name,
          slug: product.category_slug,
          count: 1,
        });
      }
    }

    for (const size of product.sizes) {
      sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
    }

    for (const c of product.colors) {
      const existing = colorMap.get(c.color);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(c.color, { hex: c.color_hex || "#A3A3A3", count: 1 });
      }
    }

    if (product.base_price < minPrice) minPrice = product.base_price;
    if (product.base_price > maxPrice) maxPrice = product.base_price;
  }

  const standardSizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
  const sortedSizes = Array.from(sizeMap.entries())
    .sort((a, b) => {
      const indexA = standardSizeOrder.indexOf(a[0]);
      const indexB = standardSizeOrder.indexOf(b[0]);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a[0].localeCompare(b[0]);
    })
    .map(([label, count]) => ({ label, count }));

  return {
    categories: Array.from(categoryMap.values()),
    sizes: sortedSizes,
    colors: Array.from(colorMap.entries()).map(([label, info]) => ({
      label,
      hex: info.hex,
      count: info.count,
    })),
    priceRange: {
      min: minPrice === Infinity ? 0 : Math.floor(minPrice),
      max: maxPrice === -Infinity ? 10000 : Math.ceil(maxPrice),
    },
  };
}

/**
 * Internal fetch for category metadata.
 */
async function fetchCategoryBySlug(slug: string): Promise<ProductCategoryMetadata | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, banner_image_url, banner_badge, banner_subtitle, seo_title, seo_description, parent_id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Database error in getCategoryBySlug:", error);
    throw new Error(`Database error fetching category: ${error.message} (${error.code || "UNKNOWN"})`);
  }

  if (!data) {
    return null;
  }

  let parentName: string | null = null;
  let parentSlug: string | null = null;

  if (data.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", data.parent_id)
      .maybeSingle();
    if (parent) {
      parentName = parent.name;
      parentSlug = parent.slug;
    }
  }

  // Type assertion or property extraction for new banner columns
  const rawCat = data as typeof data & {
    banner_image_url?: string | null;
    banner_badge?: string | null;
    banner_subtitle?: string | null;
  };

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image_url: data.image_url ?? null,
    banner_image_url: rawCat.banner_image_url ?? null,
    banner_badge: rawCat.banner_badge ?? null,
    banner_subtitle: rawCat.banner_subtitle ?? null,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
    parent_id: data.parent_id,
    parent_name: parentName,
    parent_slug: parentSlug,
  };
}

/**
 * Cached category metadata: revalidates every 5 minutes.
 * Bust with revalidateTag('navigation-categories') when categories change.
 */
const getCachedCategoryBySlug = unstable_cache(
  fetchCategoryBySlug,
  ["category-by-slug"],
  { tags: ["navigation-categories"], revalidate: 300 }
);

/**
 * Fetch category metadata by slug — cached within a request and across requests.
 */
export const getCategoryBySlug = cache(getCachedCategoryBySlug);

/**
 * Primary server-side query function for the product listing and catalog pages
 *
 * Pushes down all filtering (category, size, color, price range, stock status),
 * sorting (.order()), and pagination (.range()) directly to the Postgres database.
 * No mock fallbacks are used: fails fast and surfaces real database errors.
 */
export async function getProducts(params: ProductFilterParams = {}): Promise<ProductQueryResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || PAGE_SIZE_DEFAULT);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let categoryMeta: ProductCategoryMetadata | null = null;
  if (params.category) {
    categoryMeta = await getCategoryBySlug(params.category);
  }

  try {
    const supabase = await createClient();

    // 1. DATABASE-LEVEL CATEGORY RESOLUTION
    let targetCategoryIds: string[] | null = null;
    if (params.category) {
      const { data: allCategories, error: catErr } = await supabase
        .from("categories")
        .select("id, slug, parent_id")
        .eq("is_active", true);

      if (catErr) {
        console.error("Database error querying categories:", catErr);
        throw new Error(`Database error fetching categories: ${catErr.message} (${catErr.code || "UNKNOWN"})`);
      }

      if (allCategories && allCategories.length > 0) {
        const currentCat = allCategories.find(
          (c) => c.slug.toLowerCase() === params.category?.toLowerCase()
        );

        if (currentCat) {
          const childIds = allCategories
            .filter((c) => c.parent_id === currentCat.id)
            .map((c) => c.id);
          targetCategoryIds = [currentCat.id, ...childIds];
        } else {
          // Category slug does not exist in database
          return {
            products: [],
            totalCount: 0,
            page,
            pageSize: limit,
            totalPages: 0,
            category: categoryMeta,
            availableFilters: {
              categories: [],
              sizes: [],
              colors: [],
              priceRange: { min: 0, max: 10000 },
            },
          };
        }
      }
    }

    // 2. DATABASE-LEVEL VARIANT FILTERING (SIZE & COLOR)
    let matchingProductIds: string[] | null = null;
    const hasSizeFilter = params.size && params.size.length > 0;
    const hasColorFilter = params.color && params.color.length > 0;

    if (hasSizeFilter || hasColorFilter) {
      let variantQuery = supabase
        .from("product_variants")
        .select("product_id")
        .eq("is_active", true);

      if (hasSizeFilter) {
        variantQuery = variantQuery.in("size", params.size!);
      }
      if (hasColorFilter) {
        variantQuery = variantQuery.in("color", params.color!);
      }

      const { data: matchedVariants, error: variantErr } = await variantQuery;

      if (variantErr) {
        console.error("Database error querying product_variants:", variantErr);
        throw new Error(`Database error filtering variants: ${variantErr.message} (${variantErr.code || "UNKNOWN"})`);
      }

      matchingProductIds = Array.from(new Set((matchedVariants || []).map((v) => v.product_id)));

      // If variant filter matched 0 products in Postgres, return 0 results immediately
      if (matchingProductIds.length === 0) {
        return {
          products: [],
          totalCount: 0,
          page,
          pageSize: limit,
          totalPages: 0,
          category: categoryMeta,
          availableFilters: {
            categories: [],
            sizes: [],
            colors: [],
            priceRange: { min: 0, max: 10000 },
          },
        };
      }
    }

    // 3. DATABASE-LEVEL PRODUCT QUERY WITH SQL WHERE, ORDER BY, AND RANGE()
    let q = supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("is_active", true);

    // Apply SQL WHERE: category_id IN (...)
    if (targetCategoryIds && targetCategoryIds.length > 0) {
      q = q.in("category_id", targetCategoryIds);
    }

    // Apply SQL WHERE: id IN (matchingProductIds)
    if (matchingProductIds && matchingProductIds.length > 0) {
      q = q.in("id", matchingProductIds);
    }

    // Apply SQL WHERE: id IN (productIds)
    if (params.productIds && params.productIds.length > 0) {
      q = q.in("id", params.productIds);
    }

    // Apply SQL WHERE: name ILIKE or description ILIKE
    if (params.search && params.search.trim().length > 0) {
      const cleanSearch = params.search.trim().replace(/[%_]/g, "\\$&");
      q = q.or(`name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`);
    }

    // Apply SQL WHERE: base_price >= minPrice
    if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
      q = q.gte("base_price", params.minPrice);
    }

    // Apply SQL WHERE: base_price <= maxPrice
    if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
      q = q.lte("base_price", params.maxPrice);
    }

    // Apply SQL WHERE: stock_status != 'out_of_stock'
    if (params.inStock) {
      q = q.neq("stock_status", "out_of_stock");
    }

    // Apply SQL ORDER BY at the database level
    switch (params.sort) {
      case "price-asc":
        q = q.order("base_price", { ascending: true });
        break;
      case "price-desc":
        q = q.order("base_price", { ascending: false });
        break;
      case "newest":
        q = q.order("created_at", { ascending: false });
        break;
      case "featured":
      default:
        q = q
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    // Apply SQL PAGINATION at the database level via .range(from, to)
    const { data: dbProducts, count, error } = await q.range(from, to);

    if (error) {
      console.error("Database query failed in getProducts:", error);
      throw new Error(`Database query failed in getProducts: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    if (!dbProducts || dbProducts.length === 0) {
      return {
        products: [],
        totalCount: count ?? 0,
        page,
        pageSize: limit,
        totalPages: 0,
        category: categoryMeta,
        availableFilters: {
          categories: [],
          sizes: [],
          colors: [],
          priceRange: { min: 0, max: 10000 },
        },
      };
    }

    const totalCount = count !== null ? count : dbProducts.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const now = Date.now();

    const rawProducts = dbProducts as unknown as RawDbProduct[];
    const mappedProducts: ProductListItem[] = rawProducts.map((p) => {
      const variants = (p.product_variants || [])
        .filter((v) => v.is_active)
        .map((v) => ({ ...v, sku: v.sku || "" }));
      const images = (p.product_images || []).sort(
        (a, b) =>
          (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order
      );
      const approvedReviews = (p.reviews || []).filter((r) => r.is_approved);
      const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating =
        approvedReviews.length > 0
          ? Number((totalRating / approvedReviews.length).toFixed(1))
          : null;

      const colorMap = new Map<string, string>();
      for (const v of variants) {
        if (v.color && !colorMap.has(v.color)) {
          colorMap.set(v.color, v.color_hex || "#888888");
        }
      }
      const colors = Array.from(colorMap.entries()).map(([color, color_hex]) => {
        const matchingVariant = variants.find((v) => v.color === color);
        const matchingImg = images.find(
          (img) =>
            (matchingVariant && img.variant_id === matchingVariant.id) ||
            img.alt_text?.toLowerCase().includes(color.toLowerCase())
        );
        return {
          color,
          color_hex,
          image_url: matchingImg?.image_url || null,
        };
      });

      const sizes: string[] = Array.from(new Set(variants.map((v) => v.size)));
      const hasVariants = p.has_variants !== false && variants.length > 0;
      const totalStock = hasVariants
        ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
        : (Number(p.stock_quantity) || 0);
      const categoryData = Array.isArray(p.categories) ? p.categories[0] : p.categories;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category_id: p.category_id,
        category_name: categoryData?.name || null,
        category_slug: categoryData?.slug || null,
        base_price: Number(p.base_price),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        created_at: p.created_at,
        is_active: p.is_active,
        is_featured: p.is_featured,
        is_new: now - new Date(p.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
        stock_status: p.stock_status,
        has_variants: hasVariants,
        stock_quantity: Number(p.stock_quantity) || totalStock,
        specifications: Array.isArray(p.specifications) ? p.specifications : [],
        images,
        variants,
        colors,
        sizes,
        total_stock: totalStock,
        rating: avgRating ? { average: avgRating, count: approvedReviews.length } : null,
        free_shipping_active: Boolean(p.free_shipping_active),
        free_shipping_start: p.free_shipping_start || null,
        free_shipping_end: p.free_shipping_end || null,
        free_shipping_badge_text: p.free_shipping_badge_text || null,
      };
    });

    return {
      products: mappedProducts,
      totalCount,
      page,
      pageSize: limit,
      totalPages,
      category: categoryMeta,
      availableFilters: computeAvailableFilters(mappedProducts),
    };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }

    console.error("[getProducts] Database error:", err);
    throw err;
  }
}
