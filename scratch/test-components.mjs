/**
 * Verifies component logic and state contracts
 */

import { DEFAULT_CLOTHING_SIZE_CHART } from "../features/products/queries/get-size-chart.ts";
import { calculateReviewBreakdown } from "../features/reviews/queries/get-product-reviews.ts";

console.log("=== TESTING COMPONENT & QUERY HELPER LOGIC ===");

// 1. Size chart verification
console.log("\n[Test 1] Verifying Size Chart Data Integrity...");
console.log("Size chart name:", DEFAULT_CLOTHING_SIZE_CHART.name);
console.log("Headers:", DEFAULT_CLOTHING_SIZE_CHART.headers);
console.log("Total rows:", DEFAULT_CLOTHING_SIZE_CHART.rows.length);
if (
  DEFAULT_CLOTHING_SIZE_CHART.rows.length < 5 ||
  !DEFAULT_CLOTHING_SIZE_CHART.headers.includes("Bust (in)")
) {
  throw new Error("Size chart missing standard clothing measurements!");
}
console.log("✓ Size chart data verified!");

// 2. Review aggregate calculations
console.log("\n[Test 2] Verifying Review Breakdown Calculation...");
const sampleReviews = [{ rating: 5 }, { rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 3 }];
const breakdown = calculateReviewBreakdown(sampleReviews);
console.log("Average rating:", breakdown.average);
console.log("Total count:", breakdown.totalCount);
console.log("Star counts:", breakdown.counts);
console.log("Percentages:", breakdown.percentages);

if (breakdown.average !== 4.4 || breakdown.totalCount !== 5 || breakdown.counts[5] !== 3) {
  throw new Error("Review calculation logic error!");
}
console.log("✓ Review breakdown calculated accurately!");

console.log("\n=== ALL COMPONENT & QUERY UNIT CHECKS PASSED! ===");
