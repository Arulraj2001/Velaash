import { createClient } from "@/lib/supabase/server";

export interface CategorySizeChartItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  displayOrder: number;
  measurementUnit: "inches" | "cm";
  headers: string[];
  rows: Record<string, string>[];
  tips: string[];
}

// Fallback charts in case Supabase is unavailable or in mock environment
// Matches the real Velaash store categories (Phase 1D/5C)
export const FALLBACK_CATEGORY_SIZE_CHARTS: CategorySizeChartItem[] = [
  {
    id: "fb-cat-1",
    name: "Kurtas & Sets Size Chart",
    categoryId: "a1111111-1111-4111-a111-111111111111",
    categoryName: "Kurtas & Sets",
    categorySlug: "kurtas-sets",
    displayOrder: 1,
    measurementUnit: "inches",
    headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"],
    rows: [
      { Size: "XS", "Bust (in)": "32", "Waist (in)": "26", "Hip (in)": "35", "Length (in)": "44" },
      { Size: "S", "Bust (in)": "34", "Waist (in)": "28", "Hip (in)": "37", "Length (in)": "44" },
      { Size: "M", "Bust (in)": "36", "Waist (in)": "30", "Hip (in)": "39", "Length (in)": "45" },
      { Size: "L", "Bust (in)": "38", "Waist (in)": "32", "Hip (in)": "41", "Length (in)": "45" },
      { Size: "XL", "Bust (in)": "40", "Waist (in)": "34", "Hip (in)": "43", "Length (in)": "46" },
      { Size: "XXL", "Bust (in)": "42", "Waist (in)": "36", "Hip (in)": "45", "Length (in)": "46" },
      { Size: "Free Size", "Bust (in)": "34-40", "Waist (in)": "28-36", "Hip (in)": "38-44", "Length (in)": "46" },
    ],
    tips: [
      "Bust: Measure under arms around the fullest part of your bust.",
      "Waist: Measure around your natural waistline, keeping the tape comfortably loose.",
      "Hips: Stand with feet together and measure around fullest part of your hips.",
      "Length: Measured from high shoulder point straight down to hemline.",
      "Measurements are garment dimensions. For a relaxed fit, select one size up.",
    ],
  },
  {
    id: "fb-cat-2",
    name: "Dresses Size Chart",
    categoryId: "a4444444-4444-4444-a444-444444444444",
    categoryName: "Dresses",
    categorySlug: "dresses",
    displayOrder: 2,
    measurementUnit: "inches",
    headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Midi Length (in)", "Maxi Length (in)"],
    rows: [
      { Size: "XS", "Bust (in)": "32", "Waist (in)": "26", "Hip (in)": "36", "Midi Length (in)": "44", "Maxi Length (in)": "52" },
      { Size: "S", "Bust (in)": "34", "Waist (in)": "28", "Hip (in)": "38", "Midi Length (in)": "44.5", "Maxi Length (in)": "52.5" },
      { Size: "M", "Bust (in)": "36", "Waist (in)": "30", "Hip (in)": "40", "Midi Length (in)": "45", "Maxi Length (in)": "53" },
      { Size: "L", "Bust (in)": "38", "Waist (in)": "32", "Hip (in)": "42", "Midi Length (in)": "45.5", "Maxi Length (in)": "53.5" },
      { Size: "XL", "Bust (in)": "40", "Waist (in)": "34", "Hip (in)": "44", "Midi Length (in)": "46", "Maxi Length (in)": "54" },
      { Size: "XXL", "Bust (in)": "42", "Waist (in)": "36", "Hip (in)": "46", "Midi Length (in)": "46.5", "Maxi Length (in)": "54.5" },
    ],
    tips: [
      "Bust: Measure fullest part across chest.",
      "Waist: Measure at natural waistline above the navel.",
      "Length: Measured from high shoulder point down to finished hemline.",
    ],
  },
  {
    id: "fb-cat-3",
    name: "Co-ord Sets Size Chart",
    categoryId: "a3333333-3333-4333-a333-333333333333",
    categoryName: "Co-ord Sets",
    categorySlug: "coord-sets",
    displayOrder: 3,
    measurementUnit: "inches",
    headers: ["Size", "Top Bust (in)", "Top Length (in)", "Pant Waist (in)", "Hip (in)", "Pant Length (in)"],
    rows: [
      { Size: "XS", "Top Bust (in)": "33", "Top Length (in)": "24", "Pant Waist (in)": "26", "Hip (in)": "36", "Pant Length (in)": "37" },
      { Size: "S", "Top Bust (in)": "35", "Top Length (in)": "24.5", "Pant Waist (in)": "28", "Hip (in)": "38", "Pant Length (in)": "37.5" },
      { Size: "M", "Top Bust (in)": "37", "Top Length (in)": "25", "Pant Waist (in)": "30", "Hip (in)": "40", "Pant Length (in)": "38" },
      { Size: "L", "Top Bust (in)": "39", "Top Length (in)": "25.5", "Pant Waist (in)": "32", "Hip (in)": "42", "Pant Length (in)": "38.5" },
      { Size: "XL", "Top Bust (in)": "41", "Top Length (in)": "26", "Pant Waist (in)": "34", "Hip (in)": "44", "Pant Length (in)": "39" },
      { Size: "XXL", "Top Bust (in)": "43", "Top Length (in)": "26.5", "Pant Waist (in)": "36", "Hip (in)": "46", "Pant Length (in)": "39.5" },
    ],
    tips: [
      "Top Bust: Measure under arms around fullest part of bust.",
      "Pant Waist: Soft elasticated waistband with room for comfortable movement.",
      "Hips: Measure around fullest part of your hips with feet together.",
    ],
  },
  {
    id: "fb-cat-4",
    name: "Tops & Shirts Size Chart",
    categoryId: "a5555555-5555-4555-a555-555555555555",
    categoryName: "Tops & Shirts",
    categorySlug: "tops-shirts",
    displayOrder: 4,
    measurementUnit: "inches",
    headers: ["Size", "Bust (in)", "Waist (in)", "Shoulder (in)", "Length (in)"],
    rows: [
      { Size: "XS", "Bust (in)": "33", "Waist (in)": "28", "Shoulder (in)": "14", "Length (in)": "25" },
      { Size: "S", "Bust (in)": "35", "Waist (in)": "30", "Shoulder (in)": "14.5", "Length (in)": "25.5" },
      { Size: "M", "Bust (in)": "37", "Waist (in)": "32", "Shoulder (in)": "15", "Length (in)": "26" },
      { Size: "L", "Bust (in)": "39", "Waist (in)": "34", "Shoulder (in)": "15.5", "Length (in)": "26.5" },
      { Size: "XL", "Bust (in)": "41", "Waist (in)": "36", "Shoulder (in)": "16", "Length (in)": "27" },
      { Size: "XXL", "Bust (in)": "43", "Waist (in)": "38", "Shoulder (in)": "16.5", "Length (in)": "27.5" },
    ],
    tips: [
      "Shoulder: Measure straight across upper back from shoulder seam to shoulder seam.",
      "Bust: Measure under arms around the fullest part of bust.",
    ],
  },
  {
    id: "fb-cat-5",
    name: "Bottoms Size Chart",
    categoryId: "a6666666-6666-4666-a666-666666666666",
    categoryName: "Bottoms",
    categorySlug: "bottoms",
    displayOrder: 5,
    measurementUnit: "inches",
    headers: ["Size", "Waist (in)", "Hip (in)", "Length (in)", "Thigh (in)"],
    rows: [
      { Size: "XS", "Waist (in)": "26", "Hip (in)": "36", "Length (in)": "37", "Thigh (in)": "22" },
      { Size: "S", "Waist (in)": "28", "Hip (in)": "38", "Length (in)": "37.5", "Thigh (in)": "23" },
      { Size: "M", "Waist (in)": "30", "Hip (in)": "40", "Length (in)": "38", "Thigh (in)": "24" },
      { Size: "L", "Waist (in)": "32", "Hip (in)": "42", "Length (in)": "38.5", "Thigh (in)": "25" },
      { Size: "XL", "Waist (in)": "34", "Hip (in)": "44", "Length (in)": "39", "Thigh (in)": "26" },
      { Size: "XXL", "Waist (in)": "36", "Hip (in)": "46", "Length (in)": "39.5", "Thigh (in)": "27" },
      { Size: "Free Size", "Waist (in)": "28-36", "Hip (in)": "38-46", "Length (in)": "38", "Thigh (in)": "25" },
    ],
    tips: [
      "Waist: Elasticated waistband designed to stretch comfortably.",
      "Length: Outseam measured from waistband edge to ankle/bottom hem.",
    ],
  },
  {
    id: "fb-cat-6",
    name: "Loungewear Fit Guide",
    categoryId: "a2222222-2222-4222-a222-222222222222",
    categoryName: "Loungewear",
    categorySlug: "loungewear",
    displayOrder: 6,
    measurementUnit: "inches",
    headers: ["Size", "Comfort Bust (in)", "Waist Range (in)", "Hip (in)", "Fit Style"],
    rows: [
      { Size: "XS-S (Petite Relaxed)", "Comfort Bust (in)": "32-35", "Waist Range (in)": "26-30", "Hip (in)": "36-39", "Fit Style": "Easy Relaxed" },
      { Size: "M-L (Classic Easy)", "Comfort Bust (in)": "36-39", "Waist Range (in)": "30-34", "Hip (in)": "40-43", "Fit Style": "Relaxed Slumber" },
      { Size: "XL-XXL (Comfort Plus)", "Comfort Bust (in)": "40-44", "Waist Range (in)": "34-39", "Hip (in)": "44-48", "Fit Style": "Generous Ease" },
      { Size: "Free Size (One Size)", "Comfort Bust (in)": "34-42", "Waist Range (in)": "28-38", "Hip (in)": "38-46", "Fit Style": "Airy Kaftan Flow" },
    ],
    tips: [
      "Loungewear silhouettes are intentionally tailored with generous ease for unrestrained comfort at home.",
      "Pajama bottoms feature a flexible elasticated waistband with an adjustable front drawstring.",
      "Kaftans feature a flowing, unstructured drape suitable for all body silhouettes.",
    ],
  },
];

/**
 * Fetch all category-level size charts from the size_charts table.
 * Includes category names, slugs, and ordering.
 */
export async function getAllCategorySizeCharts(): Promise<CategorySizeChartItem[]> {
  try {
    const supabase = await createClient();

    const { data: dbCharts, error } = await supabase
      .from("size_charts")
      .select(`
        id,
        name,
        category_id,
        measurement_unit,
        chart_data,
        categories (
          id,
          name,
          slug,
          display_order
        )
      `)
      .not("category_id", "is", null)
      .is("product_id", null);

    if (error) {
      console.error("Database query failed in getAllCategorySizeCharts:", error);
      return FALLBACK_CATEGORY_SIZE_CHARTS;
    }

    if (dbCharts && dbCharts.length > 0) {
      const results: CategorySizeChartItem[] = [];

      for (const item of dbCharts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cat = item.categories as any;
        if (!cat || !cat.name) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chartData = (item.chart_data as any) || {};

        results.push({
          id: item.id,
          name: item.name || `${cat.name} Size Chart`,
          categoryId: item.category_id!,
          categoryName: cat.name,
          categorySlug: cat.slug || "",
          displayOrder: typeof cat.display_order === "number" ? cat.display_order : 99,
          measurementUnit: (item.measurement_unit as "inches" | "cm") || "inches",
          headers: Array.isArray(chartData.headers) ? chartData.headers : [],
          rows: Array.isArray(chartData.rows) ? chartData.rows : [],
          tips: Array.isArray(chartData.tips) ? chartData.tips : [],
        });
      }

      // Sort by category display order, then by category name
      results.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.categoryName.localeCompare(b.categoryName);
      });

      if (results.length > 0) {
        return results;
      }
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
    console.error("Exception in getAllCategorySizeCharts:", err);
  }

  return FALLBACK_CATEGORY_SIZE_CHARTS;
}
