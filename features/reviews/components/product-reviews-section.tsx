"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldCheck, PenLine, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import type { ProductReviewItem, ProductReviewBreakdown } from "@/features/products/types";
import { useAuth } from "@/features/auth/components/auth-provider";
import { submitProductReview } from "../actions/submit-review";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  breakdown: ProductReviewBreakdown;
  initialReviews: ProductReviewItem[];
}

export function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  breakdown,
  initialReviews,
}: ProductReviewsSectionProps) {
  const { isAuthenticated, user } = useAuth();

  const [reviews] = React.useState<ProductReviewItem[]>(initialReviews);
  const [visibleCount, setVisibleCount] = React.useState(4);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Review Form state
  const [selectedRating, setSelectedRating] = React.useState<number>(5);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [title, setTitle] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionStatus, setSubmissionStatus] = React.useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) return;

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const res = await submitProductReview({
        productId,
        rating: selectedRating,
        title,
        comment,
        customerName: user?.user_metadata?.full_name || user?.email?.split("@")[0],
      });

      if (res.success) {
        setSubmissionStatus({
          success: true,
          message:
            res.message || "Thanks! Your review has been submitted and is pending moderation.",
        });
        setTitle("");
        setComment("");
        setSelectedRating(5);
      } else {
        setSubmissionStatus({
          success: false,
          message: res.error || "Could not submit review. Please try again.",
        });
      }
    } catch {
      setSubmissionStatus({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = reviews.length > visibleCount;

  return (
    <section
      id="reviews"
      className="border-brand-border/70 scroll-mt-24 border-t pt-12 font-sans sm:pt-16"
    >
      <div className="space-y-8">
        {/* Section Heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
              Verified Patron Experience
            </span>
            <h2 className="font-heading text-brand-dark text-2xl font-semibold sm:text-3xl">
              Ratings & Reviews
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="border-brand-dark bg-brand-dark text-brand-cream hover:bg-brand-accent hover:border-brand-accent inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <PenLine className="h-4 w-4" />
            Write a Review
          </button>
        </div>

        {/* Rating Metrics Summary Card */}
        <div className="border-brand-border rounded-2xl border bg-white p-6 shadow-xs sm:p-8">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            {/* Left: Overall Score */}
            <div className="border-brand-border/70 border-b pb-6 text-center md:col-span-4 md:border-r md:border-b-0 md:pr-8 md:pb-0 md:text-left">
              <div className="font-heading text-brand-dark text-5xl font-bold sm:text-6xl">
                {breakdown.average > 0 ? breakdown.average.toFixed(1) : "5.0"}
              </div>
              <div className="my-2 flex items-center justify-center gap-1 md:justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(breakdown.average || 5)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-brand-border text-brand-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-brand-dark/70 text-xs">
                Based on{" "}
                <span className="text-brand-dark font-semibold">{breakdown.totalCount}</span>{" "}
                verified ratings
              </p>
            </div>

            {/* Right: Star Distribution Bars */}
            <div className="space-y-2.5 md:col-span-8">
              {([5, 4, 3, 2, 1] as const).map((starNum) => {
                const count = breakdown.counts[starNum] || 0;
                const percentage = breakdown.percentages[starNum] || 0;

                return (
                  <div key={starNum} className="flex items-center gap-3 text-xs">
                    <div className="text-brand-dark flex w-12 items-center gap-1 font-medium">
                      <span>{starNum}</span>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </div>

                    {/* Progress Track */}
                    <div className="bg-brand-light/60 h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Count label */}
                    <span className="text-brand-dark/60 w-8 text-right font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Individual Reviews List */}
        <div className="space-y-4">
          {visibleReviews.map((rev) => (
            <div
              key={rev.id}
              className="border-brand-border/60 hover:border-brand-border rounded-xl border bg-white p-5 transition-all sm:p-6"
            >
              <div className="border-brand-border/40 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-light text-brand-dark flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                    {rev.customer_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-brand-dark text-xs font-semibold">{rev.customer_name}</h4>
                    {rev.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-brand-border text-brand-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-brand-dark/50 text-[11px]">
                    {new Date(rev.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3">
                {rev.title && (
                  <h5 className="font-heading text-brand-dark text-sm font-semibold">
                    {rev.title}
                  </h5>
                )}
                <p className="text-brand-dark/80 text-xs leading-relaxed sm:text-sm">
                  {rev.comment}
                </p>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="border-brand-border text-brand-dark hover:border-brand-dark rounded-lg border bg-white px-6 py-2.5 text-xs font-semibold shadow-xs transition-colors"
              >
                Load More Reviews ({reviews.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="bg-brand-dark/70 fixed inset-0 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="border-brand-border animate-in fade-in zoom-in-95 relative z-10 w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl duration-200 sm:p-8">
            <div className="border-brand-border/60 flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-heading text-brand-dark text-xl font-semibold">
                  Write a Review
                </h3>
                <p className="text-brand-dark/70 text-xs">
                  Sharing your experience with{" "}
                  <span className="text-brand-dark font-medium">{productName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-brand-dark/60 hover:text-brand-dark p-1"
                aria-label="Close review dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submissionStatus?.success ? (
              <div className="space-y-3 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="font-heading text-brand-dark text-lg font-semibold">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-brand-dark/70 mx-auto max-w-xs text-xs">
                  {submissionStatus.message}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmissionStatus(null);
                  }}
                  className="bg-brand-dark hover:bg-brand-accent mt-4 rounded-lg px-5 py-2 text-xs font-medium text-white transition-colors"
                >
                  Close
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4 py-8 text-center">
                <div className="bg-brand-light text-brand-accent mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                  <PenLine className="h-6 w-6" />
                </div>
                <h4 className="font-heading text-brand-dark text-lg font-semibold">
                  Patron Sign-In Required
                </h4>
                <p className="text-brand-dark/70 mx-auto max-w-xs text-xs">
                  To maintain review authenticity, only verified patrons may submit reviews. Please
                  sign in to share your experience.
                </p>
                <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row">
                  <Link
                    href={`/account/login?redirect=/products/${productSlug}#reviews`}
                    className="bg-brand-dark text-brand-cream hover:bg-brand-accent w-full rounded-lg px-5 py-2.5 text-xs font-semibold transition-colors sm:w-auto"
                  >
                    Sign In to Continue
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="border-brand-border text-brand-dark hover:bg-brand-light/30 w-full rounded-lg border px-5 py-2.5 text-xs font-medium sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
                {submissionStatus?.success === false && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{submissionStatus.message}</span>
                  </div>
                )}

                {/* Star rating selection */}
                <div>
                  <label className="text-brand-dark mb-1.5 block text-xs font-semibold">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:ring-brand-gold rounded p-1 focus:ring-1 focus:outline-none"
                        aria-label={`${star} star rating`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= (hoverRating || selectedRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-brand-border fill-transparent"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-brand-dark/70 ml-2 text-xs font-medium">
                      {selectedRating} of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="review-title"
                    className="text-brand-dark mb-1 block text-xs font-semibold"
                  >
                    Headline / Summary (Optional)
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Gorgeous drape and vibrant color"
                    maxLength={100}
                    className="border-brand-border text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-accent focus:ring-brand-accent w-full rounded-lg border bg-white px-3.5 py-2 text-xs focus:ring-1 focus:outline-none"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label
                    htmlFor="review-comment"
                    className="text-brand-dark mb-1 block text-xs font-semibold"
                  >
                    Your Review *
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe the fabric feel, drape, sizing accuracy, and overall craftsmanship..."
                    className="border-brand-border text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-accent focus:ring-brand-accent w-full resize-none rounded-lg border bg-white p-3.5 text-xs focus:ring-1 focus:outline-none"
                  />
                  <p className="text-brand-dark/50 mt-1 text-[11px]">
                    Reviews undergo moderation before appearing publicly on the store catalog.
                  </p>
                </div>

                {/* Actions */}
                <div className="border-brand-border/60 flex items-center justify-end gap-2 border-t pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="border-brand-border text-brand-dark hover:bg-brand-light/30 rounded-lg border px-4 py-2 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || comment.trim().length < 5}
                    className="bg-brand-dark hover:bg-brand-accent flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
