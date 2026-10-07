export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "payment_failed";

export type PaymentMethod = "cod" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type RefundStatus = "not_applicable" | "pending_review" | "initiated" | "processed" | "failed";

export interface CustomerOrderListItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  firstItemTitle?: string;
  firstItemImage?: string;
  refundStatus?: RefundStatus | null;
  refundAmount?: number | null;
}

export interface CustomerOrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  size: string;
  color: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderStatusHistoryRecord {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface CustomerOrderDetail {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  codHandlingFee?: number;
  totalAmount: number;
  couponCode?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  cancelReason?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayRefundId?: string | null;
  refundStatus?: RefundStatus | null;
  refundAmount?: number | null;
  refundArn?: string | null;
  refundedAt?: string | null;
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
  items: CustomerOrderItem[];
  statusHistory: OrderStatusHistoryRecord[];
  canCancel: boolean;
  replacement?: OrderReplacementRecord | null;
  replacements?: OrderReplacementRecord[];
}

export type ReplacementStatus =
  | "pending_video_review"
  | "video_verified"
  | "approved"
  | "store_credit_issued"
  | "refund_approved"
  | "rejected"
  | "completed";

export interface OrderReplacementRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId?: string | null;
  orderItemId?: string | null;
  itemTitle: string;
  currentSize?: string | null;
  currentColor?: string | null;
  desiredSize?: string | null;
  desiredColor?: string | null;
  reason: string;
  customerPhone: string;
  customerNotes?: string | null;
  status: ReplacementStatus;
  videoReviewed: boolean;
  videoReviewedAt?: string | null;
  rejectionReason?: string | null;
  storeCreditCode?: string | null;
  storeCreditAmount?: number | null;
  replacementCourier?: string | null;
  replacementTrackingNumber?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReplacementInput {
  orderNumber: string;
  orderItemId: string;
  reason: string;
  desiredSize?: string;
  desiredColor?: string;
  customerPhone: string;
  customerNotes?: string;
}

export interface CustomerOrdersFilter {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CustomerOrdersResponse {
  orders: CustomerOrderListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

