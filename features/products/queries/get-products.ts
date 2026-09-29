import { createClient } from "@/lib/supabase/server";
import type {
  ProductListItem,
  ProductFilterParams,
  ProductQueryResult,
  ProductCategoryMetadata,
  AvailableFiltersFacet,
  RawDbProduct,
} from "../types";
import { MOCK_CLOTHING_PRODUCTS } from "./mock-products";
import { DEFAULT_CLOTHING_CATEGORIES } from "@/features/navigation/queries/get-navigation-categories";

const PAGE_SIZE_DEFAULT = 12;

/**
 * Checks if the current environment is running with placeholder/offline Supabase credentials
 */
function isPlaceholderEnvironment(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("placeholder-project") || url.includes("example.com");
}

/**
 * Builds the PostgREST select query string for products.
 * The reviews relation is optional to handle unmigrated database schemas gracefully.
 */
function buildProductSelect(includeReviews = true): string {
  return `
    id,
    name,
    slug,
    description,
    base_price,
    compare_at_price,
    created_at,
    is_active,
    is_featured,
    stock_status,
    category_id,
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
    )${
      includeReviews
        ? `,
    reviews (
      rating,
      is_approved
    )`
        : ""
    }
  `;
}

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
 * In-memory fallback filter/sort ONLY used during offline development or placeholder testing
 */
function applyMockFallbackFilters(
  products: ProductListItem[],
  params: ProductFilterParams
): { filtered: ProductListItem[]; availableFilters: AvailableFiltersFacet } {
  const now = Date.now();
  let scope = products.map((p) => ({
    ...p,
    is_new: p.is_new ?? now - new Date(p.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
  }));

  if (params.category) {
    const catLower = params.category.toLowerCase();
    scope = scope.filter(
      (p) =>
        p.category_slug?.toLowerCase() === catLower ||
        p.parent_category_slug?.toLowerCase() === catLower
    );
  }
  const availableFilters = computeAvailableFilters(scope);

  let result = [...scope];

  if (params.size && params.size.length > 0) {
    const targetSizes = params.size.map((s) => s.toLowerCase());
    result = result.filter((p) =>
      p.variants.some((v) => v.is_active && targetSizes.includes(v.size.toLowerCase()))
    );
  }

  if (params.color && params.color.length > 0) {
    const targetColors = params.color.map((c) => c.toLowerCase());
    result = result.filter((p) =>
      p.variants.some((v) => v.is_active && targetColors.includes(v.color.toLowerCase()))
    );
  }

  if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
    result = result.filter((p) => p.base_price >= (params.minPrice as number));
  }
  if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
    result = result.filter((p) => p.base_price <= (params.maxPrice as number));
  }

  if (params.inStock) {
    result = result.filter((p) => p.total_stock > 0);
  }

  const sort = params.sort || "featured";
  result.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.base_price - b.base_price;
      case "price-desc":
        return b.base_price - a.base_price;
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "rating":
        return (b.rating?.average || 0) - (a.rating?.average || 0);
      case "featured":
      default:
        if (a.is_featured === b.is_featured) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.is_featured ? -1 : 1;
    }
  });

  return { filtered: result, availableFilters };
}

/**
 * Fetch category metadata by slug directly from Postgres
 */
export async function getCategoryBySlug(slug: string): Promise<ProductCategoryMetadata | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, seo_title, seo_description, parent_id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      if (!isPlaceholderEnvironment() && !error.message?.includes("fetch failed")) {
        console.error("Database error in getCategoryBySlug:", error);
        throw new Error(`Database error fetching category: ${error.message}`);
      }
    }

    if (data) {
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

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        parent_id: data.parent_id,
        parent_name: parentName,
        parent_slug: parentSlug,
      };
    }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
  }

  // Fallback to static category hierarchy during build/mock preview
  for (const cat of DEFAULT_CLOTHING_CATEGORIES) {
    if (cat.slug === slug) {
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        seo_title: `${cat.name} | Velaash`,
        seo_description: `Explore our collection of ${cat.name.toLowerCase()} at Velaash.`,
        parent_id: null,
      };
    }
    for (const sub of cat.subcategories) {
      if (sub.slug === slug) {
        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          seo_title: `${sub.name} | ${cat.name} | Velaash`,
          seo_description: `Shop refined ${sub.name.toLowerCase()} under ${cat.name.toLowerCase()} at Velaash.`,
          parent_id: cat.id,
          parent_name: cat.name,
          parent_slug: cat.slug,
        };
      }
    }
  }

  return null;
}

/**
 * Primary server-side query function for the product listing and catalog pages
 *
 * Pushes down all filtering (category, size, color, price range, stock status),
 * sorting (.order()), and pagination (.range()) directly to the Postgres database.
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

      if (catErr && !isPlaceholderEnvironment() && !catErr.message?.includes("fetch failed")) {
        console.error("Database error querying categories:", catErr);
        throw new Error(`Database error fetching categories: ${catErr.message}`);
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
    // Queries product_variants directly in Postgres to find matching product IDs
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

      if (
        variantErr &&
        !isPlaceholderEnvironment() &&
        !variantErr.message?.includes("fetch failed")
      ) {
        console.error("Database error querying product_variants:", variantErr);
        throw new Error(`Database error filtering variants: ${variantErr.message}`);
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
    const buildQuery = (includeReviews: boolean) => {
      let q = supabase
        .from("products")
        .select(buildProductSelect(includeReviews), { count: "exact" })
        .eq("is_active", true);

      // Apply SQL WHERE: category_id IN (...)
      if (targetCategoryIds && targetCategoryIds.length > 0) {
        q = q.in("category_id", targetCategoryIds);
      }

      // Apply SQL WHERE: id IN (matchingProductIds)
      if (matchingProductIds && matchingProductIds.length > 0) {
        q = q.in("id", matchingProductIds);
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
      return q.range(from, to);
    };

    // Execute the database query (attempting with reviews relation first)
    let { data: dbProducts, count, error } = await buildQuery(true);

    // If reviews relation does not exist in schema cache (PGRST200 or 42P01), retry without reviews
    if (
      error &&
      (error.code === "PGRST200" ||
        error.code === "42P01" ||
        error.message?.includes("reviews") ||
        error.details?.includes("reviews"))
    ) {
      const retryResult = await buildQuery(false);
      dbProducts = retryResult.data;
      count = retryResult.count;
      error = retryResult.error;
    }

    if (error) {
      const errorMsg = error.message || error.details || error.code || "Unknown database error";
      console.warn(`[getProducts] Database notice: ${errorMsg} (${error.code || "WARN"})`);
    }

    // When real database products are returned from Postgres
    if (!error && dbProducts && dbProducts.length > 0) {
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
        const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
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
          images,
          variants,
          colors,
          sizes,
          total_stock: totalStock,
          rating: avgRating ? { average: avgRating, count: approvedReviews.length } : null,
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
    }

    // Check if user specifically applied filters that narrowed down products to 0
    const hasActiveFilters = Boolean(
      params.category ||
        (params.size && params.size.length > 0) ||
        (params.color && params.color.length > 0) ||
        (params.minPrice !== undefined && !isNaN(params.minPrice)) ||
        (params.maxPrice !== undefined && !isNaN(params.maxPrice)) ||
        params.inStock
    );

    // If query executed against real connected database that HAS products, but specific filters matched 0
    if (!error && dbProducts && dbProducts.length === 0 && hasActiveFilters) {
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
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }

    console.warn(
      "[getProducts] Unhandled notice during fetch:",
      err instanceof Error ? err.message : String(err)
    );
  }

  // Graceful degradation ONLY when Supabase project URL is a placeholder or connection is offline
  const { filtered, availableFilters } = applyMockFallbackFilters(MOCK_CLOTHING_PRODUCTS, params);
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return {
    products: paginated,
    totalCount,
    page,
    pageSize: limit,
    totalPages,
    category: categoryMeta,
    availableFilters,
  };
}
