import { z } from "zod";

export const OrderAddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  streetAddress: z.string().min(5),
  apartment: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(6).max(6),
  country: z.string().default("India"),
});

export const OrderStatusSchema = z.enum([
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  title: z.string(),
  sku: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  total: z.number().positive(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  userId: z.string().uuid().optional(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
  shippingAddress: OrderAddressSchema,
  subtotal: z.number().positive(),
  tax: z.number().nonnegative(),
  shippingFee: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  paymentId: z.string().optional(),
  shippingTrackingId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderAddress = z.infer<typeof OrderAddressSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
