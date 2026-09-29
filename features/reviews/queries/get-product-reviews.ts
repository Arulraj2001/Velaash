import { createClient } from "@/lib/supabase/server";
import type { ProductReviewItem, ProductReviewBreakdown } from "@/features/products/types";

/**
 * Calculates rating distribution and average score from real reviews
 */
export function calculateReviewBreakdown(
  reviews: Array<{ rating: number }>
): ProductReviewBreakdown {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const total = reviews.length;
  if (total === 0) {
    return {
      average: 0,
      totalCount: 0,
      counts,
      percentages: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  let sum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[star] = (counts[star] || 0) + 1;
    sum += r.rating;
  }

  const average = Number((sum / total).toFixed(1));

  return {
    average,
    totalCount: total,
    counts,
    percentages: {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    },
  };
}

/**
 * Fetch approved reviews and metrics for a specific product directly from Supabase
 */
export async function getProductReviews(
  productId: string
): Promise<{ reviews: ProductReviewItem[]; breakdown: ProductReviewBreakdown }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, customer_name, rating, title, comment, is_verified_purchase, is_approved, created_at"
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database query failed in getProductReviews:", error);
      throw new Error(`Database error fetching reviews: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    const reviews = (data || []) as ProductReviewItem[];
    const breakdown = calculateReviewBreakdown(reviews);

    return {
      reviews,
      breakdown,
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

    console.error("[getProductReviews] Database error:", err);
    throw err;
  }
}
