import { z } from "zod";

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  title: z.string(),
  slug: z.string(),
  size: z.string(),
  color: z.string(),
  colorHex: z.string().optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  image: z.string(),
  quantity: z.number().int().positive().max(10),
  maxStock: z.number().int().nonnegative().default(10),
});

export const CartSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  items: z.array(CartItemSchema).default([]),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  shippingFee: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
