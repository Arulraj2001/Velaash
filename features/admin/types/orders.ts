import { z } from "zod";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/features/orders/types";

export type { OrderStatus, PaymentMethod, PaymentStatus };

/**
 * Valid order fulfillment status state machine transitions.
 * Enforces linear progression: confirmed -> packed -> shipped -> delivered.
 * Cancellations are permitted prior to dispatch ('shipped').
 * Refunds are allowed for cancelled or returned orders.
 */
export const VALID_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
  payment_failed: ["cancelled"],
} as const;

/**
 * Validates whether an order can transition from current status to target status.
 */
export function canTransitionStatus(
  current: OrderStatus,
  target: OrderStatus
): boolean {
  if (current === target) return false;
  const allowed = VALID_ORDER_STATUS_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

/**
 * Human-readable labels for order fulfillment statuses.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Verification",
  confirmed: "Confirmed",
  packed: "Packed & Ready",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  payment_failed: "Payment Failed",
};

/**
 * Visual styling tokens for order fulfillment status badges.
 */
export const ORDER_STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  packed: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  shipped: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  out_for_delivery: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
  },
  delivered: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  refunded: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
    dot: "bg-slate-500",
  },
  payment_failed: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

/**
 * Visual styling tokens for payment status badges.
 */
export const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  failed: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  refunded: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
  },
};

/**
 * Row item for TanStack Table order list.
 */
export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  itemCount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  needsAction: boolean;
  trackingNumber?: string | null;
  courierName?: string | null;
}

export interface AdminOrderItem {
  id: string;
  productId?: string | null;
  variantId?: string | null;
  productName: string;
  size: string;
  color: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string | null;
}

export interface AdminOrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  cancelReason?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    addressType?: string;
  };
  billingAddress?: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    addressType?: string;
  } | null;
  items: AdminOrderItem[];
  statusHistory: AdminOrderStatusHistoryItem[];
  canCancel: boolean;
  canRefund: boolean;
}

/**
 * Zod validation schema for updating order status.
 */
export const UpdateOrderStatusSchema = z
  .object({
    status: z.enum([
      "pending",
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refunded",
      "payment_failed",
    ]),
    trackingNumber: z.string().trim().optional(),
    courierName: z.string().trim().optional(),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "shipped") {
      if (!data.trackingNumber || data.trackingNumber.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tracking number is required when marking an order as shipped.",
          path: ["trackingNumber"],
        });
      }
      if (!data.courierName || data.courierName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Courier / delivery partner name is required when marking as shipped.",
          path: ["courierName"],
        });
      }
    }
  });

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
