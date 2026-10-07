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
