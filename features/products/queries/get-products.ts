import { createClient } from "@/lib/supabase/server";
import type {
  ProductListItem,
  ProductFilterParams,
  ProductQueryResult,
  ProductCategoryMetadata,
  AvailableFiltersFacet,
} from "../types";
import { MOCK_CLOTHING_PRODUCTS } from "./mock-products";
import { DEFAULT_CLOTHING_CATEGORIES } from "@/features/navigation/queries/get-navigation-categories";

const PAGE_SIZE_DEFAULT = 12;

/**
 * Helper to extract available filter facets from a list of products
 */
function computeAvailableFilters(allProducts: ProductListItem[]): AvailableFiltersFacet {
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>();
  const sizeMap = new Map<string, number>();
  const colorMap = new Map<string, { hex: string; count: number }>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const product of allProducts) {
    // Categories
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

    // Sizes
    for (const size of product.sizes) {
      sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
    }

    // Colors
    for (const c of product.colors) {
      const existing = colorMap.get(c.color);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(c.color, { hex: c.color_hex || "#A3A3A3", count: 1 });
      }
    }

    // Prices
    if (product.base_price < minPrice) minPrice = product.base_price;
    if (product.base_price > maxPrice) maxPrice = product.base_price;
  }

  // Standard size ordering
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
 * Filter, sort, and paginate products in-memory (resilient fallback or post-fetch)
 */
function applyFiltersAndSort(
  products: ProductListItem[],
  params: ProductFilterParams
): { filtered: ProductListItem[]; availableFilters: AvailableFiltersFacet } {
  // First compute available filters across the entire active inventory for this category scope
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

  // Now apply user filters
  let result = [...scope];

  // Size filter
  if (params.size && params.size.length > 0) {
    const targetSizes = params.size.map((s) => s.toLowerCase());
    result = result.filter((p) =>
      p.variants.some((v) => v.is_active && targetSizes.includes(v.size.toLowerCase()))
    );
  }

  // Color filter
  if (params.color && params.color.length > 0) {
    const targetColors = params.color.map((c) => c.toLowerCase());
    result = result.filter((p) =>
      p.variants.some((v) => v.is_active && targetColors.includes(v.color.toLowerCase()))
    );
  }

  // Price range
  if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
    result = result.filter((p) => p.base_price >= (params.minPrice as number));
  }
  if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
    result = result.filter((p) => p.base_price <= (params.maxPrice as number));
  }

  // In Stock only
  if (params.inStock) {
    result = result.filter((p) => p.total_stock > 0);
  }

  // Sorting
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
 * Fetch category metadata by slug
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

    if (data && !error) {
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

  // Fallback to default clothing categories tree
  for (const cat of DEFAULT_CLOTHING_CATEGORIES) {
    if (cat.slug === slug) {
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        seo_title: `${cat.name} | Velaash Boutique`,
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
 */
export async function getProducts(params: ProductFilterParams = {}): Promise<ProductQueryResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || PAGE_SIZE_DEFAULT);
  let categoryMeta: ProductCategoryMetadata | null = null;

  if (params.category) {
    categoryMeta = await getCategoryBySlug(params.category);
  }

  try {
    const supabase = await createClient();

    // Query active products from Supabase
    const query = supabase
      .from("products")
      .select(
        `
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
        ),
        reviews (
          rating,
          is_approved
        )
      `
      )
      .eq("is_active", true);

    const { data: dbProducts, error } = await query;

    if (!error && dbProducts && dbProducts.length > 0) {
      // Map Supabase rows to ProductListItem
      const mappedProducts: ProductListItem[] = dbProducts.map((p) => {
        const variants = (p.product_variants || []).filter((v) => v.is_active);
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

        // Unique colors
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
              (img as unknown as { color?: string }).color === color
          );
          return {
            color,
            color_hex,
            image_url: matchingImg?.image_url || null,
          };
        });

        const sizes = Array.from(new Set(variants.map((v) => v.size)));
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
          is_new: Date.now() - new Date(p.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
          stock_status: p.stock_status,
          images,
          variants,
          colors,
          sizes,
          total_stock: totalStock,
          rating: avgRating ? { average: avgRating, count: approvedReviews.length } : null,
        };
      });

      const { filtered, availableFilters } = applyFiltersAndSort(mappedProducts, params);
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

  // Graceful fallback to mock dataset
  const { filtered, availableFilters } = applyFiltersAndSort(MOCK_CLOTHING_PRODUCTS, params);
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
