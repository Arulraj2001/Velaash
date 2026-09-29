import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerOrderListItem,
  CustomerOrdersFilter,
  CustomerOrdersResponse,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../types";

/**
 * Retrieves paginated orders belonging to a customer.
 * Securely scopes query to orders where customer_id matches the user's ID
 * or the shipping address email matches the authenticated user's email.
 *
 * CALL-SITE JUSTIFICATION FOR ADMIN CLIENT:
 * Uses elevated client to ensure orders placed both via direct authenticated checkout
 * and via guest checkout (prior to account linking) with matching email are correctly
 * presented in the customer's order history.
 */
export async function getCustomerOrders(
  userId: string,
  userEmail?: string | null,
  filters: CustomerOrdersFilter = {}
): Promise<CustomerOrdersResponse> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(filters.limit || 10, 50));
  const offset = (page - 1) * limit;

  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminSupabase = createAdminClient();
  } catch (err) {
    console.error("Failed to initialize admin Supabase client in getCustomerOrders:", err);
    return {
      orders: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }

  // Construct query: match by customer_id or email
  let query = adminSupabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      created_at,
      status,
      payment_method,
      payment_status,
      total_amount,
      customer_id,
      shipping_address
    `,
      { count: "exact" }
    );

  if (userEmail) {
    query = query.or(
      `customer_id.eq.${userId},shipping_address->>email.ilike.${userEmail}`
    );
  } else {
    query = query.eq("customer_id", userId);
  }

  // Filter by status if provided and not "all"
  if (filters.status && filters.status !== "all") {
    const s = filters.status.toLowerCase();
    if (s === "pending") {
      query = query.in("status", ["pending"]);
    } else if (s === "confirmed") {
      query = query.in("status", ["confirmed", "packed"]);
    } else if (s === "shipped") {
      query = query.in("status", ["shipped", "out_for_delivery"]);
    } else if (s === "delivered") {
      query = query.in("status", ["delivered"]);
    } else if (s === "cancelled") {
      query = query.in("status", ["cancelled", "refunded", "payment_failed"]);
    } else {
      query = query.eq("status", s as OrderStatus);
    }
  }

  // Order newest first
  query = query.order("created_at", { ascending: false });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: ordersData, count, error } = await query;

  if (error || !ordersData) {
    console.error("Error fetching customer orders:", error);
    return {
      orders: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // If no orders, return early
  if (ordersData.length === 0) {
    return {
      orders: [],
      totalCount,
      totalPages,
      currentPage: page,
    };
  }

  const orderIds = ordersData.map((o) => o.id);

  // Fetch items for these orders to get counts and first item preview
  const { data: itemsData } = await adminSupabase
    .from("order_items")
    .select(`
      id,
      order_id,
      product_id,
      product_name_snapshot,
      quantity
    `)
    .in("order_id", orderIds);

  // Fetch product primary images for preview thumbnails
  const productIds = Array.from(
    new Set((itemsData || []).map((i) => i.product_id).filter(Boolean) as string[])
  );

  const imageMap: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: imagesData } = await adminSupabase
      .from("product_images")
      .select("product_id, image_url, is_primary")
      .in("product_id", productIds)
      .order("display_order", { ascending: true });

    if (imagesData) {
      for (const img of imagesData) {
        if (!imageMap[img.product_id] || img.is_primary) {
          imageMap[img.product_id] = img.image_url;
        }
      }
    }
  }

  // Aggregate items by order_id
  const itemsByOrderId: Record<
    string,
    { count: number; firstTitle?: string; firstImage?: string }
  > = {};

  if (itemsData) {
    for (const item of itemsData) {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = {
          count: item.quantity,
          firstTitle: item.product_name_snapshot,
          firstImage: item.product_id ? imageMap[item.product_id] : undefined,
        };
      } else {
        itemsByOrderId[item.order_id].count += item.quantity;
      }
    }
  }

  const formattedOrders: CustomerOrderListItem[] = ordersData.map((order) => {
    const itemInfo = itemsByOrderId[order.id] || { count: 1 };
    return {
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      status: order.status as OrderStatus,
      paymentMethod: order.payment_method as PaymentMethod,
      paymentStatus: order.payment_status as PaymentStatus,
      totalAmount: Number(order.total_amount),
      itemCount: itemInfo.count,
      firstItemTitle: itemInfo.firstTitle,
      firstItemImage: itemInfo.firstImage,
    };
  });

  return {
    orders: formattedOrders,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
