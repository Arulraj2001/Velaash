import { createClient } from "@/lib/supabase/server";
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
}

/**
 * Fetches products list for the TanStack Table with joined categories, variants, images, and order history flags.
 */
export async function getAdminProductsList(
  filter: GetAdminProductsFilter = {}
): Promise<AdminProductListItem[]> {
  const supabase = await createClient();

  // 1. Fetch set of product IDs currently referenced in order_items
  const { data: orderedItems } = await supabase
    .from("order_items")
    .select("product_id")
    .not("product_id", "is", null);

  const orderedProductIds = new Set<string>();
  if (orderedItems) {
    for (const item of orderedItems) {
      if (item.product_id) orderedProductIds.add(item.product_id);
    }
  }

  const selectWithNew = `
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
  `;

  const selectFallback = `
    id,
    name,
    slug,
    category_id,
    base_price,
    compare_at_price,
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
  `;

  // 2. Query products with categories, variants, and images
  let query = supabase
    .from("products")
    .select(selectWithNew)
    .order("updated_at", { ascending: false });

  if (filter.categoryId && filter.categoryId !== "all") {
    query = query.eq("category_id", filter.categoryId);
  }

  if (filter.status === "active") {
    query = query.eq("is_active", true);
  } else if (filter.status === "inactive") {
    query = query.eq("is_active", false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] | null = null;
  const { data: primaryData, error: primaryError } = await query;

  if (!primaryError) {
    products = primaryData;
  } else {
    // Fallback if column migration is pending on remote DB
    let fallbackQuery = supabase
      .from("products")
      .select(selectFallback)
      .order("updated_at", { ascending: false });

    if (filter.categoryId && filter.categoryId !== "all") {
      fallbackQuery = fallbackQuery.eq("category_id", filter.categoryId);
    }
    if (filter.status === "active") {
      fallbackQuery = fallbackQuery.eq("is_active", true);
    } else if (filter.status === "inactive") {
      fallbackQuery = fallbackQuery.eq("is_active", false);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) {
      console.error("Failed to query admin products list:", fallbackError);
      return [];
    }
    products = fallbackData;
  }

  // 3. Map into AdminProductListItem
  const mappedList: AdminProductListItem[] = (products ?? []).map((p) => {
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

  // Client-side search matching by product name OR SKU
  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    return mappedList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.skus.some((sku) => sku.toLowerCase().includes(q))
    );
  }

  return mappedList;
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

  const p = productRes.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawImages = (p.product_images ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVariants = (p.product_variants ?? []) as any[];

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
