import { z } from "zod";

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  title: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.number().positive(),
  image: z.string().url(),
  quantity: z.number().int().positive().max(10),
});

export const CartSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  items: z.array(CartItemSchema).default([]),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  shippingFee: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
