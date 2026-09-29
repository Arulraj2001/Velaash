import { z } from "zod";

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  comment: z.string().min(10).max(1000),
  verifiedPurchase: z.boolean().default(false),
  images: z.array(z.string().url()).optional(),
  createdAt: z.string().datetime(),
});

export const CreateReviewInputSchema = ReviewSchema.omit({
  id: true,
  createdAt: true,
  verifiedPurchase: true,
});

export type Review = z.infer<typeof ReviewSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
