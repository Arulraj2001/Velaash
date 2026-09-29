import { z } from "zod";

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "Custom"]),
  color: z.string(),
  sku: z.string(),
  stockQuantity: z.number().int().nonnegative(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2, "Product title must be at least 2 characters"),
  slug: z.string(),
  description: z.string(),
  fabric: z.string().optional(),
  craftsmanship: z.string().optional(),
  careInstructions: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(ProductVariantSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
