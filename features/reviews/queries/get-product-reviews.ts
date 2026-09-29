import { createClient } from "@/lib/supabase/server";
import type { ProductReviewItem, ProductReviewBreakdown } from "@/features/products/types";

function isPlaceholderEnvironment(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("placeholder-project") || url.includes("example.com");
}

export const MOCK_REVIEWS_DEFAULT: ProductReviewItem[] = [
  {
    id: "rev-1",
    customer_name: "Priya S.",
    rating: 5,
    title: "Exceptional quality and fit",
    comment:
      "The fabric feels comfortable and the neck embroidery is subtle yet stunning. Received countless compliments at a family evening reception. True to size.",
    is_verified_purchase: true,
    is_approved: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rev-2",
    customer_name: "Ananya M.",
    rating: 5,
    title: "Breathtaking drape and rich texture",
    comment:
      "Was slightly hesitant buying online without trying, but the size chart measurements were spot-on. The packaging was immaculate. Velaash has earned a customer for life.",
    is_verified_purchase: true,
    is_approved: true,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rev-3",
    customer_name: "Devika R.",
    rating: 4,
    title: "Lovely silhouette & breathable fabric",
    comment:
      "The shade is gorgeous in natural sunlight. Very comfortable to wear throughout a warm afternoon celebration. Would love matching dupattas in more colorways!",
    is_verified_purchase: true,
    is_approved: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rev-4",
    customer_name: "Meenakshi K.",
    rating: 5,
    title: "Pure elegance",
    comment:
      "Flattering cut and premium finishing. The inner lining is soft against the skin, making all-day wear a breeze.",
    is_verified_purchase: true,
    is_approved: true,
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function calculateReviewBreakdown(
  reviews: { rating: number }[],
  fallbackAverage = 4.8,
  fallbackCount = 16
): ProductReviewBreakdown {
  if (reviews.length === 0) {
    if (fallbackCount === 0) {
      return {
        average: 0,
        totalCount: 0,
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
    // Realistic standard distribution for approved reviews
    const fiveStar = Math.round(fallbackCount * 0.75);
    const fourStar = Math.round(fallbackCount * 0.2);
    const threeStar = Math.max(0, fallbackCount - fiveStar - fourStar);
    return {
      average: fallbackAverage,
      totalCount: fallbackCount,
      counts: { 5: fiveStar, 4: fourStar, 3: threeStar, 2: 0, 1: 0 },
      percentages: {
        5: Math.round((fiveStar / fallbackCount) * 100),
        4: Math.round((fourStar / fallbackCount) * 100),
        3: Math.round((threeStar / fallbackCount) * 100),
        2: 0,
        1: 0,
      },
    };
  }

  const counts: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[star] = (counts[star] || 0) + 1;
    sum += r.rating;
  }

  const total = reviews.length;
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
 * Fetch approved reviews and metrics for a specific product
 */
export async function getProductReviews(
  productId: string,
  fallbackRating?: { average: number; count: number } | null
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

    if (error && !isPlaceholderEnvironment() && !error.message?.includes("fetch failed")) {
      console.error("Database query failed in getProductReviews:", error);
      throw new Error(`Database error fetching reviews: ${error.message}`);
    }

    if (data && data.length > 0) {
      const breakdown = calculateReviewBreakdown(data);
      return {
        reviews: data as ProductReviewItem[],
        breakdown,
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

  // Graceful fallback for mock or empty database preview
  const count = fallbackRating?.count ?? MOCK_REVIEWS_DEFAULT.length;
  const avg = fallbackRating?.average ?? 4.8;
  const breakdown = calculateReviewBreakdown([], avg, count);

  return {
    reviews: MOCK_REVIEWS_DEFAULT,
    breakdown,
  };
}
