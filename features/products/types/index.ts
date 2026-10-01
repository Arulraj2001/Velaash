import { z } from "zod";

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "Custom"]),
  color: z.string(),
  sku: z.string(),
  stockQuantity: z.number().int().nonnegative(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2, "Product title must be at least 2 characters"),
  slug: z.string(),
  description: z.string(),
  fabric: z.string().optional(),
  craftsmanship: z.string().optional(),
  careInstructions: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(ProductVariantSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

/**
 * Image item attached to a product
 */
export interface ProductImageItem {
  id: string;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
  variant_id?: string | null;
  color?: string | null;
}

/**
 * Product variant record for stock, sizing, and color attributes
 */
export interface ProductVariantItem {
  id: string;
  size: string;
  color: string;
  color_hex?: string | null;
  stock_quantity: number;
  sku: string;
  price_override?: number | null;
  is_active: boolean;
}

/**
 * Color swatch option extracted from variants
 */
export interface ProductColorSwatch {
  color: string;
  color_hex: string;
  image_url?: string | null;
}

/**
 * Review summary for star rating and review count
 */
export interface ProductReviewSummary {
  average: number;
  count: number;
}

/**
 * Denormalized Product list item used in the catalog grid & product cards
 */
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  parent_category_slug?: string | null;
  base_price: number;
  compare_at_price?: number | null;
  created_at: string;
  is_active: boolean;
  is_featured: boolean;
  is_new?: boolean;
  stock_status: string;
  images: ProductImageItem[];
  variants: ProductVariantItem[];
  colors: ProductColorSwatch[];
  sizes: string[];
  total_stock: number;
  rating?: ProductReviewSummary | null;
}

/**
 * Sort options supported by the product catalog
 */
export type ProductSortOption = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

/**
 * Parsed filter parameters from URL SearchParams
 */
export interface ProductFilterParams {
  category?: string;
  size?: string[];
  color?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
  productIds?: string[];
  search?: string;
}

/**
 * Metadata for active category or sub-category
 */
export interface ProductCategoryMetadata {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  parent_id?: string | null;
  parent_name?: string | null;
  parent_slug?: string | null;
}

/**
 * Filter facets returned alongside products for dynamic sidebar options
 */
export interface AvailableFiltersFacet {
  categories: { name: string; slug: string; count: number }[];
  sizes: { label: string; count: number }[];
  colors: { label: string; hex: string; count: number }[];
  priceRange: { min: number; max: number };
}

/**
 * Complete server query result for the shop and category pages
 */
export interface ProductQueryResult {
  products: ProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  category?: ProductCategoryMetadata | null;
  availableFilters: AvailableFiltersFacet;
}

/**
 * Size Chart specifications
 */
export interface SizeChartData {
  id?: string;
  name: string;
  measurement_unit: "inches" | "cm";
  headers: string[];
  rows: Record<string, string>[];
  tips?: string[];
}

/**
 * Individual customer review for PDP
 */
export interface ProductReviewItem {
  id: string;
  customer_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

/**
 * Review metrics & star breakdown
 */
export interface ProductReviewBreakdown {
  average: number;
  totalCount: number;
  counts: { 1: number; 2: number; 3: number; 4: number; 5: number };
  percentages: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

/**
 * Comprehensive Product Detail item for /products/[slug]
 */
export interface ProductDetailItem extends ProductListItem {
  fabric?: string | null;
  care_instructions?: string | null;
  craftsmanship?: string | null;
  is_made_to_order?: boolean;
  weight_grams?: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  hsn_code?: string | null;
  gst_rate?: number;
  blouse_included?: boolean;
  saree_length_meters?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[];
  size_chart?: SizeChartData | null;
  reviews_breakdown: ProductReviewBreakdown;
  reviews: ProductReviewItem[];
}

/**
 * Raw product row shape returned by Postgres queries before mapping
 */
export interface RawDbProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  created_at: string;
  is_active: boolean;
  is_featured: boolean;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  category_id: string | null;
  categories:
    | { id: string; name: string; slug: string; parent_id: string | null }
    | { id: string; name: string; slug: string; parent_id: string | null }[]
    | null;
  product_variants: {
    id: string;
    size: string;
    color: string;
    color_hex: string | null;
    stock_quantity: number;
    sku: string | null;
    price_override: number | null;
    is_active: boolean;
  }[];
  product_images: {
    id: string;
    image_url: string;
    alt_text?: string | null;
    display_order: number;
    is_primary: boolean;
    variant_id?: string | null;
  }[];
  reviews?: {
    rating: number;
    is_approved: boolean;
  }[];
}
