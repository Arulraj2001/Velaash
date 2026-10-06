"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateProductCatalog } from "@/lib/revalidation";

export interface SubmitReviewInput {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  customerName?: string;
}

export interface SubmitReviewResponse {
  success: boolean;
  message?: string;
  error?: string;
  needsAuth?: boolean;
}

export async function submitProductReview(input: SubmitReviewInput): Promise<SubmitReviewResponse> {
  const { productId, rating, title, comment, customerName } = input;

  if (!productId) {
    return { success: false, error: "Product ID is required." };
  }

  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: "Please provide a valid rating between 1 and 5 stars." };
  }

  if (!comment || comment.trim().length < 5) {
    return { success: false, error: "Review comment must be at least 5 characters long." };
  }

  try {
    const supabase = await createClient();

    // Check user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If not authenticated, require login
    if (!user) {
      return {
        success: false,
        error: "Please sign in to your Velaash account to submit a review.",
        needsAuth: true,
      };
    }

    const name =
      customerName || user.user_metadata?.full_name || user.email?.split("@")[0] || "Valued Customer";

    // Insert review with is_approved = false (pending moderation)
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      customer_id: user.id,
      customer_name: name,
      rating,
      title: title?.trim() || null,
      comment: comment.trim(),
      is_approved: false, // Pending admin moderation
      is_verified_purchase: true,
    });

    if (error) {
      console.error("Error submitting review to Supabase:", error);
      return {
        success: false,
        error: "Failed to submit your review. Please try again.",
      };
    }

    // Revalidate product catalog and PDP
    try {
      const { data: prod } = await supabase
        .from("products")
        .select("slug")
        .eq("id", productId)
        .maybeSingle();

      revalidateProductCatalog(prod?.slug);
    } catch {
      revalidateProductCatalog();
    }

    return {
      success: true,
      message: "Thanks! Your review has been submitted and is pending moderation.",
    };
  } catch (err: unknown) {
    console.error("Unexpected error in submitProductReview:", err);
    return {
      success: false,
      error: "An unexpected error occurred while submitting your review. Please try again.",
    };
  }
}
