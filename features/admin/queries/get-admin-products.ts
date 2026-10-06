import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type {

  AdminProductListItem,
  AdminProductDetail,
  AdminProductImageFormItem,
  AdminProductVariantFormItem,
} from "../types/products";

export interface GetAdminProductsFilter {
  search?: string;
  categoryId?: string;
  status?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface AdminProductsListResult {
  products: AdminProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetches products list for the TanStack Table with joined categories, variants, images, and order history flags.
 * Server-side pagination and filtering; search is pushed to Postgres via ILIKE.
 */
export async function getAdminProductsList(
  filter: GetAdminProductsFilter = {}
): Promise<AdminProductsListResult> {
  const { search, categoryId, status, page = 1, pageSize = 50 } = filter;
  const supabase = await createClient();

  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  // 1. Fetch products with server-side filtering — no full table scan on order_items
  let query = supabase
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        category_id,
        base_price,
        compare_at_price,
        has_variants,
        stock_quantity,
        specifications,
        is_active,
        is_featured,
        stock_status,
        created_at,
        updated_at,
        categories (
          id,
          name
        ),
        product_variants (
          id,
          size,
          color,
          sku,
          stock_quantity,
          price_override,
          is_active
        ),
        product_images (
          id,
          image_url,
          alt_text,
          is_primary,
          display_order
        )
      `,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(fromIndex, toIndex);

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  // Server-side search: name ILIKE or slug ILIKE (avoids JS client-side filter over all rows)
  if (search && search.trim()) {
    const cleanSearch = search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(`name.ilike.%${cleanSearch}%,slug.ilike.%${cleanSearch}%`);
  }

  const { data: products, count, error: productsError } = await query;

  if (productsError) {
    console.error("Failed to query admin products list:", productsError);
    return { products: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }

  const productList = products ?? [];
  const totalCount = count ?? productList.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 2. Fetch only the product_ids in this page that have been ordered
  //    Uses idx_order_items_product_id index — not a full table scan
  const pageProductIds = productList.map((p) => p.id);
  const orderedProductIds = new Set<string>();

  if (pageProductIds.length > 0) {
    const { data: orderedItems } = await supabase
      .from("order_items")
      .select("product_id")
      .in("product_id", pageProductIds)
      .not("product_id", "is", null);

    if (orderedItems) {
      for (const item of orderedItems) {
        if (item.product_id) orderedProductIds.add(item.product_id);
      }
    }
  }

  // 3. Map into AdminProductListItem
  const mappedList: AdminProductListItem[] = productList.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const category = p.categories as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variants = (p.product_variants ?? []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = (p.product_images ?? []) as any[];

    const primaryImg = images.find((i) => i.is_primary) || images[0];
    const row = p as Record<string, unknown>;
    const hasVariants = row.has_variants !== undefined
      ? Boolean(row.has_variants)
      : variants.length > 0;

    const totalStock = hasVariants
      ? variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0)
      : Number(row.stock_quantity ?? (variants.length > 0 ? variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0) : 0));
    const skus = variants.map((v) => v.sku).filter(Boolean);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      category_name: category?.name ?? "Uncategorized",
      base_price: Number(p.base_price || 0),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      total_stock: totalStock,
      has_variants: hasVariants,
      stock_quantity: (row.stock_quantity as number | undefined) ?? totalStock,
      specifications: Array.isArray(row.specifications)
        ? (row.specifications as { label: string; value: string }[])
        : [],
      is_active: p.is_active,
      is_featured: p.is_featured,
      stock_status: p.stock_status,
      thumbnail_url: primaryImg?.image_url ?? null,
      variants_count: variants.length,
      skus,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock_quantity: Number(v.stock_quantity || 0),
        price_override: v.price_override ? Number(v.price_override) : null,
        is_active: Boolean(v.is_active),
      })),
      updated_at: p.updated_at,
      created_at: p.created_at,
      has_orders: orderedProductIds.has(p.id),
    };
  });

  return { products: mappedList, totalCount, page, pageSize, totalPages };
}

/**
 * Fetches complete product details for the Add/Edit form.
 */
export async function getAdminProductById(
  productId: string
): Promise<AdminProductDetail | null> {
  const supabase = await createClient();

  const [productRes, orderedRes, sizeChartRes] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        product_variants (
          id,
          size,
          color,
          color_hex,
          sku,
          stock_quantity,
          price_override,
          is_active
        ),
        product_images (
          id,
          image_url,
          alt_text,
          is_primary,
          display_order,
          variant_id
        )
      `)
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId),
    supabase
      .from("size_charts")
      .select("id")
      .eq("product_id", productId)
      .maybeSingle(),
  ]);

  if (productRes.error || !productRes.data) {
    return null;
  }

  interface ProductImageRecord {
    id: string;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean | null;
    display_order: number | null;
    variant_id: string | null;
  }

  interface ProductVariantRecord {
    id: string;
    size: string;
    color: string;
    color_hex: string | null;
    sku: string;
    stock_quantity: number;
    price_override: number | null;
    is_active: boolean;
  }

  const p = productRes.data as Database["public"]["Tables"]["products"]["Row"] & {
    product_images?: ProductImageRecord[];
    product_variants?: ProductVariantRecord[];
    has_variants?: boolean;
    stock_quantity?: number;
    specifications?: unknown;
    free_shipping_active?: boolean;
    free_shipping_start?: string | null;
    free_shipping_end?: string | null;
    free_shipping_badge_text?: string | null;
    is_returnable?: boolean;
    return_override_note?: string | null;
  };
  const rawImages = p.product_images ?? [];
  const rawVariants = p.product_variants ?? [];

  // Sort images by display_order
  rawImages.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const images: AdminProductImageFormItem[] = rawImages.map((img) => ({
    id: img.id,
    image_url: img.image_url,
    alt_text: img.alt_text ?? "",
    is_primary: Boolean(img.is_primary),
    display_order: Number(img.display_order ?? 0),
    variant_id: img.variant_id ?? null,
  }));

  const variants: AdminProductVariantFormItem[] = rawVariants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    color_hex: v.color_hex ?? null,
    sku: v.sku,
    stock_quantity: Number(v.stock_quantity ?? 0),
    price_override: v.price_override ? Number(v.price_override) : null,
    is_active: Boolean(v.is_active),
  }));

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category_id: p.category_id,
    base_price: Number(p.base_price || 0),
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    has_variants: p.has_variants !== undefined ? Boolean(p.has_variants) : rawVariants.length > 0,
    stock_quantity: p.stock_quantity ?? rawVariants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0),
    specifications: Array.isArray(p.specifications)
      ? (p.specifications as unknown as { label: string; value: string }[])
      : [],
    fabric: p.fabric,
    care_instructions: p.care_instructions,
    craftsmanship: p.craftsmanship ?? null,
    is_active: p.is_active,
    is_featured: p.is_featured,
    is_made_to_order: p.is_made_to_order,
    stock_status: p.stock_status,
    weight_grams: p.weight_grams,
    length_cm: p.length_cm ? Number(p.length_cm) : null,
    width_cm: p.width_cm ? Number(p.width_cm) : null,
    height_cm: p.height_cm ? Number(p.height_cm) : null,
    hsn_code: p.hsn_code,
    gst_rate: Number(p.gst_rate ?? 5),
    blouse_included: p.blouse_included,
    saree_length_meters: p.saree_length_meters ? Number(p.saree_length_meters) : null,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    seo_keywords: p.seo_keywords ?? [],
    images,
    variants,
    size_chart_id: sizeChartRes.data?.id ?? null,
    free_shipping_active: Boolean(p.free_shipping_active),
    free_shipping_start: p.free_shipping_start ?? null,
    free_shipping_end: p.free_shipping_end ?? null,
    free_shipping_badge_text: p.free_shipping_badge_text ?? null,
    is_returnable: p.is_returnable !== undefined && p.is_returnable !== null ? Boolean(p.is_returnable) : true,
    return_override_note: p.return_override_note ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    has_orders: (orderedRes.count ?? 0) > 0,
  };
}

/**
 * Retrieves categories for dropdown selection with hierarchy and status.
 */
export async function getCategoriesForSelect(): Promise<
  { id: string; name: string; slug: string; parent_id: string | null; is_active: boolean }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, display_order, is_active")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch categories for select:", error);
    return [];
  }

  return (data as { id: string; name: string; slug: string; parent_id: string | null; is_active: boolean }[]) ?? [];
}

/**
 * Retrieves size charts for selection.
 */
export async function getSizeChartsForSelect(): Promise<
  { id: string; name: string; measurement_unit: string; category_id: string | null; product_id: string | null }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("size_charts")
    .select("id, name, measurement_unit, category_id, product_id")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch size charts:", error);
    return [];
  }

  return data ?? [];
}
