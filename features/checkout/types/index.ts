import { z } from "zod";

/**
 * Indian 6-digit PIN code regex: starts with digits 1-9 followed by 5 digits
 */
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Indian 10-digit mobile number regex
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export const ContactInfoSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)"),
  createAccount: z.boolean(),
});

export const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  addressLine1: z.string().trim().min(5, "Address line 1 must be at least 5 characters"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City must be at least 2 characters"),
  state: z.string().trim().min(2, "Please select or enter your state"),
  pincode: z
    .string()
    .trim()
    .regex(INDIAN_PINCODE_REGEX, "Please enter a valid 6-digit Indian PIN code (e.g. 560001)"),
  addressType: z.enum(["home", "work", "other"]),
  saveAddress: z.boolean(),
});

export const CheckoutFormSchema = z.object({
  contact: ContactInfoSchema,
  shippingAddress: ShippingAddressSchema,
  shippingMethod: z.literal("standard"),
  paymentMethod: z.enum(["razorpay", "cod"]),
  appliedCouponCode: z.string().nullable().optional(),
  idempotencyKey: z.string().min(1),
});

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;

export interface SavedCustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  addressType: "home" | "work" | "other";
  isDefault: boolean;
}

export const CreateOrderLineItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable().or(z.literal("")),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .max(50, "Quantity cannot exceed 50 per line item"),
});

export type CreateOrderLineItemInput = z.input<typeof CreateOrderLineItemSchema>;

export const CreateOrderInputSchema = z.object({
  contact: z.object({
    email: z.string().trim().email("Please enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)"),
    createAccount: z.boolean().optional().default(false),
  }),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    phone: z
      .string()
      .trim()
      .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit phone number"),
    addressLine1: z.string().trim().min(5, "Address line 1 must be at least 5 characters"),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(2, "City must be at least 2 characters"),
    state: z.string().trim().min(2, "Please select or enter your state"),
    pincode: z
      .string()
      .trim()
      .regex(INDIAN_PINCODE_REGEX, "Please enter a valid 6-digit Indian PIN code (e.g. 560001)"),
    addressType: z.enum(["home", "work", "other"]).optional().default("home"),
    saveAddress: z.boolean().optional().default(false),
  }),
  paymentMethod: z.enum(["razorpay", "cod"]),
  items: z.array(CreateOrderLineItemSchema).min(1, "Cart cannot be empty"),
  couponCode: z.string().nullish(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

export type CreateOrderInput = z.input<typeof CreateOrderInputSchema>;

export type CreateOrderResponse =
  | {
      success: true;
      orderNumber: string;
      orderId: string;
      totalAmount: number;
      paymentMethod: "razorpay" | "cod";
      isDuplicate?: boolean;
      alreadyCompleted?: boolean;
      razorpayOrderId?: string;
      razorpayKeyId?: string;
      amountPaise?: number;
      currency?: string;
      accessToken?: string;
    }
  | {
      success: false;
      error: string;
      code?:
        | "OUT_OF_STOCK"
        | "COUPON_INVALID"
        | "EMPTY_CART"
        | "COD_UNAVAILABLE"
        | "COD_RATE_LIMIT_EXCEEDED"
        | "VALIDATION_FAILED"
        | "INVALID_INPUT"
        | "GATEWAY_ERROR";
    };

export const VerifyRazorpayPaymentSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay Signature is required"),
});

export type VerifyRazorpayPaymentInput = z.infer<typeof VerifyRazorpayPaymentSchema>;

export type VerifyRazorpayPaymentResponse =
  | {
      success: true;
      orderNumber: string;
      isAlreadyProcessed?: boolean;
      accessToken?: string;
    }
  | {
      success: false;
      error: string;
      code?:
        | "SIGNATURE_VERIFICATION_FAILED"
        | "ORDER_NOT_FOUND"
        | "INTERNAL_ERROR"
        | "PAYMENT_NOT_CAPTURED"
        | "PAYMENT_PENDING_WEBHOOK";
    };

