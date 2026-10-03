import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyOrderAccessToken,
  maskPhoneNumber,
  maskEmail,
  maskStreetAddress,
} from "../utils/order-access-token";

export interface OrderItemDetail {
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cod" | "razorpay";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  codHandlingFee?: number;
  totalAmount: number;
  couponCode?: string | null;
  createdAt: string;
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
  items: OrderItemDetail[];
  accountCreatedFromGuest?: boolean;
  accessLevel: "FULL" | "MASKED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

/**
 * Shared in-memory mock order store for fallback offline & test verification
 */
export const MOCK_ORDERS_STORE = new Map<string, OrderDetail>();

export async function getOrderByNumber(
  orderNumber: string,
  options?: {
    accessToken?: string;
    cookieToken?: string;
  }
): Promise<OrderDetail | null> {
  let orderData: OrderDetail | null = null;
  let currentUserId: string | null = null;
  let currentUserEmail: string | null = null;

  // 1. Identify current authenticated customer if available
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      currentUserId = user.id;
      currentUserEmail = user.email || null;
    }
  } catch {
    // Guest or outside request context
  }

  // 2. Attempt database retrieval via elevated admin
  // CALL-SITE JUSTIFICATION:
  // Elevated admin client is required here to safely retrieve order details for guest orders
  // (where auth.uid() is null and RLS customer policy does not allow select).
  // Security and privacy boundaries are strictly enforced right below via the accessLevel logic.
  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminSupabase = createAdminClient();
  } catch {
    // Fallback to mock store
  }

  if (adminSupabase) {
    try {
      const { data: dbOrder, error: orderErr } = await adminSupabase
        .from("orders")
        .select(`
          id,
          order_number,
          customer_id,
          status,
          payment_method,
          payment_status,
          subtotal,
          shipping_charge,
          discount_amount,
          total_amount,
          shipping_address,
          coupon_code,
          notes,
          created_at
        `)
        .eq("order_number", orderNumber)
        .single();

      if (!orderErr && dbOrder) {
        // Fetch order items
        const { data: dbItems } = await adminSupabase
          .from("order_items")
          .select(`
            id,
            product_id,
            variant_id,
            product_name_snapshot,
            variant_details_snapshot,
            unit_price,
            quantity,
            subtotal
          `)
          .eq("order_id", dbOrder.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ship = (dbOrder.shipping_address as any) || {};
        // Extract cod fee from notes if present
        let codFee = 0;
        const codMatch = dbOrder.notes?.match(/\[COD handling fee: ₹(\d+)\]/);
        if (codMatch) {
          codFee = Number(codMatch[1]);
        }

        const items: OrderItemDetail[] = (dbItems || []).map((item) => ({
          id: item.id,
          productId: item.product_id || undefined,
          variantId: item.variant_id || undefined,
          title: item.product_name_snapshot,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          size: (item.variant_details_snapshot as any)?.size || "Regular",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (item.variant_details_snapshot as any)?.color || "Standard",
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          subtotal: Number(item.subtotal),
        }));

        orderData = {
          id: dbOrder.id,
          orderNumber: dbOrder.order_number,
          customerId: dbOrder.customer_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: dbOrder.status as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paymentMethod: dbOrder.payment_method as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paymentStatus: dbOrder.payment_status as any,
          subtotal: Number(dbOrder.subtotal),
          shippingCharge: Number(dbOrder.shipping_charge),
          discountAmount: Number(dbOrder.discount_amount),
          codHandlingFee: codFee,
          totalAmount: Number(dbOrder.total_amount),
          couponCode: dbOrder.coupon_code,
          createdAt: dbOrder.created_at,
          shippingAddress: {
            fullName: ship.fullName || "Valued Customer",
            phone: ship.phone || "",
            email: ship.email || "",
            addressLine1: ship.addressLine1 || "",
            addressLine2: ship.addressLine2 || null,
            city: ship.city || "",
            state: ship.state || "",
            pincode: ship.pincode || "",
            addressType: ship.addressType || "home",
          },
          items,
          accountCreatedFromGuest: Boolean(dbOrder.notes?.includes("[guest_account_created: true]")),
          accessLevel: "FULL",
        };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to in-memory store if DB query returned null
  if (!orderData) {
    const mockOrder = MOCK_ORDERS_STORE.get(orderNumber);
    if (mockOrder) {
      orderData = JSON.parse(JSON.stringify(mockOrder));
    }
  }

  if (!orderData) {
    return null;
  }

  // 3. Determine Access Control Level
  // Full Access granted if:
  // a) Logged-in user owns the order
  // b) Valid access token passed via query (?token=...)
  // c) Valid access token in checkout session cookie
  const isOwner = Boolean(
    (currentUserId && currentUserId === orderData.customerId) ||
      (currentUserEmail && currentUserEmail.toLowerCase() === orderData.shippingAddress.email?.toLowerCase())
  );


  const providedToken = options?.accessToken || options?.cookieToken;
  const hasValidSessionToken = providedToken
    ? verifyOrderAccessToken(orderNumber, providedToken)
    : false;

  const hasFullAccess = isOwner || hasValidSessionToken;

  if (!hasFullAccess) {
    // Apply PII Masking for Direct / Unauthenticated visits
    return {
      ...orderData,
      accessLevel: "MASKED",
      shippingAddress: {
        ...orderData.shippingAddress,
        phone: maskPhoneNumber(orderData.shippingAddress.phone),
        email: maskEmail(orderData.shippingAddress.email),
        addressLine1: maskStreetAddress(orderData.shippingAddress.addressLine1),
        addressLine2: null,
      },
    };
  }

  return {
    ...orderData,
    accessLevel: "FULL",
  };
}
