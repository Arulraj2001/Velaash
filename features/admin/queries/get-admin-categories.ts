import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminCategoryItem,
  AdminCategorySizeChartData,
} from "../types/categories";

export interface AdminCategoriesQueryResult {
  tree: AdminCategoryItem[];
  topLevelCategories: { id: string; name: string; slug: string }[];
  totalCategoriesCount: number;
}

/**
 * Fetches the full category hierarchy for the admin panel, including
 * nested sub-categories, active product counts, and category-level default size charts.
 * Permission: view_categories (Both Staff and Owner).
 */
export async function getAdminCategoriesTree(): Promise<AdminCategoriesQueryResult> {
  await requireAdmin("view_categories");

  const adminClient = createAdminClient();

  // 1. Fetch all categories ordered by display_order
  const { data: rawCategories, error: catErr } = await adminClient
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (catErr) {
    console.error("Failed to fetch admin categories:", catErr);
    throw new Error(`Failed to load categories: ${catErr.message}`);
  }

  const allCategories = rawCategories ?? [];

  // 2. Fetch active product counts grouped by category_id
  const { data: productsData, error: prodErr } = await adminClient
    .from("products")
    .select("category_id")
    .eq("is_active", true);

  if (prodErr) {
    console.warn("Could not fetch product counts for categories:", prodErr.message);
  }

  const countMap = new Map<string, number>();
  for (const p of productsData ?? []) {
    if (p.category_id) {
      countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
    }
  }

  // 3. Fetch category default size charts
  const { data: sizeChartsData, error: chartErr } = await adminClient
    .from("size_charts")
    .select("id, name, category_id, chart_data, measurement_unit")
    .not("category_id", "is", null);

  if (chartErr) {
    console.warn("Could not fetch category size charts:", chartErr.message);
  }

  const sizeChartMap = new Map<string, AdminCategorySizeChartData>();
  for (const sc of sizeChartsData ?? []) {
    if (sc.category_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chartJson = (sc.chart_data || {}) as any;
      sizeChartMap.set(sc.category_id, {
        id: sc.id,
        name: sc.name,
        measurement_unit: (sc.measurement_unit as "inches" | "cm") || "inches",
        headers: Array.isArray(chartJson.headers) ? chartJson.headers : [],
        rows: Array.isArray(chartJson.rows) ? chartJson.rows : [],
        tips: Array.isArray(chartJson.tips) ? chartJson.tips : [],
      });
    }
  }

  // 4. Group subcategories by parent_id
  const subCategoryMap = new Map<string, AdminCategoryItem[]>();
  for (const cat of allCategories) {
    if (cat.parent_id) {
      const list = subCategoryMap.get(cat.parent_id) || [];
      list.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url: cat.image_url,
        display_order: cat.display_order,
        is_active: cat.is_active,
        parent_id: cat.parent_id,
        seo_title: cat.seo_title,
        seo_description: cat.seo_description,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
        product_count: countMap.get(cat.id) || 0,
        size_chart: sizeChartMap.get(cat.id) || null,
        subcategories: [],
      });
      subCategoryMap.set(cat.parent_id, list);
    }
  }

  // Sort subcategories by display_order
  for (const list of subCategoryMap.values()) {
    list.sort((a, b) => a.display_order - b.display_order);
  }

  // 5. Build top-level tree with nested subcategories
  const tree: AdminCategoryItem[] = allCategories
    .filter((cat) => !cat.parent_id)
    .sort((a, b) => a.display_order - b.display_order)
    .map((top) => ({
      id: top.id,
      name: top.name,
      slug: top.slug,
      description: top.description,
      image_url: top.image_url,
      display_order: top.display_order,
      is_active: top.is_active,
      parent_id: null,
      seo_title: top.seo_title,
      seo_description: top.seo_description,
      created_at: top.created_at,
      updated_at: top.updated_at,
      product_count: countMap.get(top.id) || 0,
      size_chart: sizeChartMap.get(top.id) || null,
      subcategories: subCategoryMap.get(top.id) || [],
    }));

  const topLevelCategories = tree.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));

  return {
    tree,
    topLevelCategories,
    totalCategoriesCount: allCategories.length,
  };
}
