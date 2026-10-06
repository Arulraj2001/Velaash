import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminOrderListItem,
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderStatusHistoryItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../types/orders";
import {
  extractTrackingInfo,
  extractAdminNotes,
  extractCustomerNotes,
} from "../utils/order-metadata";
import { deduplicateOrderStatusHistory } from "@/features/orders/utils/order-history-dedup";

export interface GetAdminOrdersParams {
  search?: string;
  status?: OrderStatus | "all";
  paymentMethod?: PaymentMethod | "all";
  paymentStatus?: PaymentStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  filter?: "all" | "needs_action";
  couponCode?: string;
  sortBy?: "date" | "total" | "status" | "needs_action";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface AdminOrdersListResult {
  orders: AdminOrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  needsActionCount: number;
}

/**
 * Checks whether an order qualifies as 'Needs Action'
 * (confirmed/paid and awaiting packing/shipping).
 */
export function isOrderNeedingAction(status: OrderStatus, paymentStatus: PaymentStatus): boolean {
  if (status === "confirmed") return true;
  if (status === "pending" && paymentStatus === "paid") return true;
  return false;
}

/**
 * Retrieves paginated, filtered, and searchable orders for the admin list table.
 */
export async function getAdminOrders(
  params: GetAdminOrdersParams = {}
): Promise<AdminOrdersListResult> {
  const {
    search = "",
    status = "all",
    paymentMethod = "all",
    paymentStatus = "all",
    dateFrom,
    dateTo,
    filter = "all",
    couponCode,
    sortBy = "date",
    sortOrder = "desc",
    page = 1,
    pageSize = 20,
  } = params;

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    const serverClient = await createClient();
    supabase = serverClient as unknown as ReturnType<typeof createAdminClient>;
  }

  // Concurrently count total 'needs action' orders across the system
  const needsActionPromise = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["confirmed", "pending"])
    .neq("status", "cancelled");

  // Query base orders
  let query = supabase.from("orders").select(
    `
      id,
      order_number,
      customer_id,
      status,
      payment_method,
      payment_status,
      total_amount,
      shipping_address,
      notes,
      created_at
    `,
    { count: "exact" }
  );

  // Status Filter
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // Payment Method Filter
  if (paymentMethod !== "all") {
    query = query.eq("payment_method", paymentMethod);
  }

  // Payment Status Filter
  if (paymentStatus !== "all") {
    query = query.eq("payment_status", paymentStatus);
  }

  // Date Range Filters
  if (dateFrom) {
    query = query.gte("created_at", new Date(dateFrom).toISOString());
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  // Needs Action Filter
  if (filter === "needs_action") {
    query = query.in("status", ["confirmed", "pending"]);
  }

  // Coupon Code Filter
  if (couponCode && couponCode.trim()) {
    query = query.eq("coupon_code", couponCode.trim().toUpperCase());
  }

  // Search Filter: Order Number
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    query = query.or(
      `order_number.ilike.%${trimmedSearch}%,shipping_address->>fullName.ilike.%${trimmedSearch}%,shipping_address->>phone.ilike.%${trimmedSearch}%`
    );
  }

  // Sorting
  const isAsc = sortOrder === "asc";
  if (sortBy === "total") {
    query = query.order("total_amount", { ascending: isAsc });
  } else if (sortBy === "status") {
    query = query.order("status", { ascending: isAsc });
  } else {
    // Default: date
    query = query.order("created_at", { ascending: isAsc });
  }

  // Pagination bounds
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;
  query = query.range(fromIndex, toIndex);

  const [{ count: needsActionCount }, { data: rawOrders, count, error }] = await Promise.all([
    needsActionPromise,
    query,
  ]);

  if (error) {
    console.error("Error fetching admin orders list:", error);
    return {
      orders: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      needsActionCount: needsActionCount ?? 0,
    };
  }

  // Fetch item counts for retrieved orders in a single query
  const orderIds = (rawOrders || []).map((o) => o.id);
  const itemCountMap = new Map<string, number>();

  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, quantity")
      .in("order_id", orderIds);

    if (items) {
      for (const item of items) {
        itemCountMap.set(
          item.order_id,
          (itemCountMap.get(item.order_id) || 0) + (item.quantity || 1)
        );
      }
    }
  }

  // Map to AdminOrderListItem
  const mappedOrders: AdminOrderListItem[] = (rawOrders || []).map((order) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = (order.shipping_address as any) || {};
    const tracking = extractTrackingInfo(order);
    const needsAction = isOrderNeedingAction(
      order.status as OrderStatus,
      order.payment_status as PaymentStatus
    );

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: addr.fullName || "Guest Customer",
      customerPhone: addr.phone || "—",
      customerEmail: addr.email || "—",
      itemCount: itemCountMap.get(order.id) || 0,
      totalAmount: Number(order.total_amount) || 0,
      paymentMethod: order.payment_method as PaymentMethod,
      paymentStatus: order.payment_status as PaymentStatus,
      status: order.status as OrderStatus,
      createdAt: order.created_at,
      needsAction,
      trackingNumber: tracking.trackingNumber,
      courierName: tracking.courierName,
    };
  });

  // If sort by needs_action requested, re-sort orders so needs_action === true are at the top
  if (sortBy === "needs_action") {
    mappedOrders.sort((a, b) => {
      if (a.needsAction === b.needsAction) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.needsAction ? -1 : 1;
    });
  }

  const totalCount = count ?? mappedOrders.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    orders: mappedOrders,
    totalCount,
    page,
    pageSize,
    totalPages,
    needsActionCount: needsActionCount ?? 0,
  };
}

/**
 * Retrieves full details for a single order, including item snapshots, addresses,
 * status history audit trail, and admin metadata.
 */
export async function getAdminOrderDetail(
  orderNumber: string
): Promise<AdminOrderDetail | null> {
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    const serverClient = await createClient();
    supabase = serverClient as unknown as ReturnType<typeof createAdminClient>;
  }

  // 1. Fetch order header
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderErr || !order) {
    return null;
  }

  // 2. Fetch order items
  const { data: itemsData } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  // 3. Fetch status history
  const { data: historyData } = await supabase
    .from("order_status_history")
    .select("id, status, note, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipAddr = (order.shipping_address as any) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const billAddr = (order.billing_address as any) || null;

  const tracking = extractTrackingInfo(order);
  const adminNotes = extractAdminNotes(order);
  const customerNotes = extractCustomerNotes(order);

  // Map order items
  const mappedItems: AdminOrderItem[] = (itemsData || []).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variantDetails = (item.variant_details_snapshot as any) || {};
    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: item.product_name_snapshot,
      size: variantDetails.size || "Standard",
      color: variantDetails.color || "Default",
      sku: variantDetails.sku || null,
      unitPrice: Number(item.unit_price) || 0,
      quantity: item.quantity || 1,
      subtotal: Number(item.subtotal) || 0,
      imageUrl: variantDetails.image_url || variantDetails.imageUrl || null,
    };
  });

  // Map status history
  const mappedHistory: AdminOrderStatusHistoryItem[] = deduplicateOrderStatusHistory(
    (historyData || []).map((h) => ({
      id: h.id,
      status: h.status as OrderStatus,
      note: h.note,
      createdAt: h.created_at,
    }))
  );

  const currentStatus = order.status as OrderStatus;
  const currentPaymentStatus = order.payment_status as PaymentStatus;

  const canCancel = ["pending", "confirmed", "packed"].includes(currentStatus);
  const canRefund =
    ["cancelled", "delivered"].includes(currentStatus) &&
    currentPaymentStatus === "paid";

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    status: currentStatus,
    paymentMethod: order.payment_method as PaymentMethod,
    paymentStatus: currentPaymentStatus,
    subtotal: Number(order.subtotal) || 0,
    shippingCharge: Number(order.shipping_charge) || 0,
    discountAmount: Number(order.discount_amount) || 0,
    totalAmount: Number(order.total_amount) || 0,
    couponCode: order.coupon_code,
    notes: customerNotes,
    adminNotes,
    cancelReason: order.cancel_reason,
    trackingNumber: tracking.trackingNumber,
    courierName: tracking.courierName,
    shiprocketOrderId: order.shiprocket_order_id ?? null,
    shiprocketShipmentId: order.shiprocket_shipment_id ?? null,
    razorpayPaymentId: order.razorpay_payment_id,
    razorpayOrderId: order.razorpay_order_id,
    razorpayRefundId: (order as unknown as Record<string, unknown>).razorpay_refund_id as string | null ?? null,
    refundStatus: (order as unknown as Record<string, unknown>).refund_status as AdminOrderDetail["refundStatus"] ?? null,
    refundAmount: (order as unknown as Record<string, unknown>).refund_amount ? Number((order as unknown as Record<string, unknown>).refund_amount) : null,
    refundArn: (order as unknown as Record<string, unknown>).refund_arn as string | null ?? null,
    refundedAt: (order as unknown as Record<string, unknown>).refunded_at as string | null ?? null,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    shippingAddress: {
      fullName: shipAddr.fullName || "",
      phone: shipAddr.phone || "",
      email: shipAddr.email || "",
      addressLine1: shipAddr.addressLine1 || "",
      addressLine2: shipAddr.addressLine2 || null,
      city: shipAddr.city || "",
      state: shipAddr.state || "",
      pincode: shipAddr.pincode || "",
      addressType: shipAddr.addressType,
    },
    billingAddress: billAddr
      ? {
          fullName: billAddr.fullName || "",
          phone: billAddr.phone || "",
          email: billAddr.email || "",
          addressLine1: billAddr.addressLine1 || "",
          addressLine2: billAddr.addressLine2 || null,
          city: billAddr.city || "",
          state: billAddr.state || "",
          pincode: billAddr.pincode || "",
          addressType: billAddr.addressType,
        }
      : null,
    items: mappedItems,
    statusHistory: mappedHistory,
    canCancel,
    canRefund,
  };
}
