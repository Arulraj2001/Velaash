import { createClient } from "@/lib/supabase/server";
import type { SizeChartData } from "../types";

function isPlaceholderEnvironment(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("placeholder-project") || url.includes("example.com");
}

export const DEFAULT_CLOTHING_SIZE_CHART: SizeChartData = {
  name: "Velaash Standard Garment Fit & Measurements",
  measurement_unit: "inches",
  headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"],
  rows: [
    { Size: "XS", "Bust (in)": "32", "Waist (in)": "26", "Hip (in)": "35", "Length (in)": "44" },
    { Size: "S", "Bust (in)": "34", "Waist (in)": "28", "Hip (in)": "37", "Length (in)": "44" },
    { Size: "M", "Bust (in)": "36", "Waist (in)": "30", "Hip (in)": "39", "Length (in)": "45" },
    { Size: "L", "Bust (in)": "38", "Waist (in)": "32", "Hip (in)": "41", "Length (in)": "45" },
    { Size: "XL", "Bust (in)": "40", "Waist (in)": "34", "Hip (in)": "43", "Length (in)": "46" },
    { Size: "XXL", "Bust (in)": "42", "Waist (in)": "36", "Hip (in)": "45", "Length (in)": "46" },
    {
      Size: "Free Size",
      "Bust (in)": "34-40",
      "Waist (in)": "28-36",
      "Hip (in)": "38-44",
      "Length (in)": "46",
    },
  ],
  tips: [
    "Bust: Measure under arms around the fullest part of your bust.",
    "Waist: Measure around your natural waistline, keeping the tape comfortably loose.",
    "Hips: Stand with feet together and measure around the fullest part of your hips.",
    "Length: Measured from high shoulder point straight down to hemline.",
    "Measurements are garment dimensions. For a relaxed fit, select one size up.",
  ],
};

/**
 * Fetch size chart by product override or category default
 */
export async function getSizeChart(
  productId: string,
  categoryId?: string | null
): Promise<SizeChartData> {
  try {
    const supabase = await createClient();

    // 1. Check for product-specific override
    const { data: productChart, error: pErr } = await supabase
      .from("size_charts")
      .select("id, name, chart_data, measurement_unit")
      .eq("product_id", productId)
      .maybeSingle();

    if (pErr && !isPlaceholderEnvironment() && !pErr.message?.includes("fetch failed")) {
      console.error("Database query failed in getSizeChart (product):", pErr);
    }

    if (productChart && productChart.chart_data) {
      const data = productChart.chart_data as unknown as {
        headers?: string[];
        rows?: Record<string, string>[];
        tips?: string[];
      };
      return {
        id: productChart.id,
        name: productChart.name,
        measurement_unit: (productChart.measurement_unit as "inches" | "cm") || "inches",
        headers: data.headers || DEFAULT_CLOTHING_SIZE_CHART.headers,
        rows: data.rows || DEFAULT_CLOTHING_SIZE_CHART.rows,
        tips: data.tips || DEFAULT_CLOTHING_SIZE_CHART.tips,
      };
    }

    // 2. Check for category-level default (with parent taxonomy inheritance)
    if (categoryId) {
      let resolvedChart = null;

      const { data: catChart, error: cErr } = await supabase
        .from("size_charts")
        .select("id, name, chart_data, measurement_unit")
        .eq("category_id", categoryId)
        .maybeSingle();

      if (cErr && !isPlaceholderEnvironment() && !cErr.message?.includes("fetch failed")) {
        console.error("Database query failed in getSizeChart (category):", cErr);
      }

      if (catChart && catChart.chart_data) {
        resolvedChart = catChart;
      } else {
        // Sub-category fallback: Check if parent category has a default size chart
        const { data: catRecord } = await supabase
          .from("categories")
          .select("parent_id")
          .eq("id", categoryId)
          .maybeSingle();

        if (catRecord?.parent_id) {
          const { data: parentChart, error: parentErr } = await supabase
            .from("size_charts")
            .select("id, name, chart_data, measurement_unit")
            .eq("category_id", catRecord.parent_id)
            .maybeSingle();

          if (parentErr && !isPlaceholderEnvironment() && !parentErr.message?.includes("fetch failed")) {
            console.error("Database query failed in getSizeChart (parent category):", parentErr);
          }

          if (parentChart && parentChart.chart_data) {
            resolvedChart = parentChart;
          }
        }
      }

      if (resolvedChart && resolvedChart.chart_data) {
        const data = resolvedChart.chart_data as unknown as {
          headers?: string[];
          rows?: Record<string, string>[];
          tips?: string[];
        };
        return {
          id: resolvedChart.id,
          name: resolvedChart.name,
          measurement_unit: (resolvedChart.measurement_unit as "inches" | "cm") || "inches",
          headers: data.headers || DEFAULT_CLOTHING_SIZE_CHART.headers,
          rows: data.rows || DEFAULT_CLOTHING_SIZE_CHART.rows,
          tips: data.tips || DEFAULT_CLOTHING_SIZE_CHART.tips,
        };
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
  }

  return DEFAULT_CLOTHING_SIZE_CHART;
}
