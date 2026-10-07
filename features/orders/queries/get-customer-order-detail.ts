import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerOrderDetail,
  CustomerOrderItem,
  OrderStatus,
  OrderStatusHistoryRecord,
  PaymentMethod,
  PaymentStatus,
} from "../types";
import { extractTrackingInfo, extractCustomerNotes } from "@/features/admin/utils/order-metadata";
import { deduplicateOrderStatusHistory } from "../utils/order-history-dedup";
import { getReplacementForOrderQuery } from "../actions/replacement-actions";


/**
 * Retrieves full details for a customer's specific order.
 * Strictly verifies ownership against the authenticated customer's ID and email.
 * If ownership fails or the order doesn't exist, returns NULL (enabling a strict 404 response).
 *
 * CALL-SITE JUSTIFICATION FOR ADMIN CLIENT:
 * Uses elevated client to safely query across related order_items, order_status_history,
 * and product images while strictly enforcing caller-side ownership isolation.
 */
export async function getCustomerOrderDetail(
  orderNumber: string,
  userId: string,
  userEmail?: string | null
): Promise<CustomerOrderDetail | null> {
  if (!orderNumber || !userId) {
    return null;
  }

  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminSupabase = createAdminClient();
  } catch (err) {
    console.error("Failed to initialize admin Supabase client in getCustomerOrderDetail:", err);
    return null;
  }

  // 1. Fetch Order Record (with defensive fallback if migration 035 not yet run)
  let { data: order, error: orderErr } = await adminSupabase
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
      billing_address,
      coupon_code,
      notes,
      cancel_reason,
      tracking_number,
      courier_name,
      shiprocket_order_id,
      shiprocket_shipment_id,
      razorpay_payment_id,
      razorpay_refund_id,
      refund_status,
      refund_amount,
      refund_arn,
      refunded_at,
      created_at,
      updated_at
    `)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderErr && (orderErr as { code?: string }).code === "42703") {
    // Undefined column fallback if migration 035 hasn't been executed in database yet
    const fallbackRes = await adminSupabase
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
        billing_address,
        coupon_code,
        notes,
        cancel_reason,
        tracking_number,
        courier_name,
        shiprocket_order_id,
        shiprocket_shipment_id,
        razorpay_payment_id,
        created_at,
        updated_at
      `)
      .eq("order_number", orderNumber)
      .maybeSingle();

    order = fallbackRes.data as typeof order;
    orderErr = fallbackRes.error;
  }

  if (orderErr || !order) {
    return null;
  }

  // 2. Strict Ownership Verification
  // The logged-in customer must either:
  // a) Have their user ID matching order.customer_id, OR
  // b) Have their verified email matching the order's shipping address email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipAddr = (order.shipping_address as any) || {};
  const isOwner =
    order.customer_id === userId ||
    (userEmail && shipAddr.email && userEmail.toLowerCase() === shipAddr.email.toLowerCase());

  if (!isOwner) {
    // Return null so the calling page renders a 404 Not Found,
    // avoiding disclosing existence of the order to probes.
    return null;
  }

  // 3. Fetch Items
  const { data: itemsData } = await adminSupabase
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
    .eq("order_id", order.id);

  // Fetch product images for items
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

  const items: CustomerOrderItem[] = (itemsData || []).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vSnap = (item.variant_details_snapshot as any) || {};
    return {
      id: item.id,
      productId: item.product_id || undefined,
      variantId: item.variant_id || undefined,
      title: item.product_name_snapshot,
      size: vSnap.size || "Free Size",
      color: vSnap.color || "Standard",
      sku: vSnap.sku || undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      imageUrl: item.product_id ? imageMap[item.product_id] : undefined,
    };
  });

  // 4. Fetch Order Status History (Audit Trail Timeline)
  const { data: historyData } = await adminSupabase
    .from("order_status_history")
    .select("id, status, note, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const rawStatusHistory: OrderStatusHistoryRecord[] = (historyData || []).map((h) => ({
    id: h.id,
    status: h.status as OrderStatus,
    note: h.note,
    createdAt: h.created_at,
  }));

  const statusHistory: OrderStatusHistoryRecord[] = deduplicateOrderStatusHistory(rawStatusHistory);

  // If no history records exist yet, synthesize the initial placement event
  if (statusHistory.length === 0) {
    statusHistory.push({
      id: "synthetic-initial",
      status: order.status as OrderStatus,
      note: "Order placed successfully",
      createdAt: order.created_at,
    });
  }

  // 5. Extract COD handling fee if noted in notes
  let codFee = 0;
  const codMatch = order.notes?.match(/\[COD handling fee: ₹(\d+)\]/);
  if (codMatch) {
    codFee = Number(codMatch[1]);
  }

  // 6. Cancellation Eligibility
  // Customer can cancel only while pending, confirmed, or packed.
  // Shipped, out_for_delivery, delivered, cancelled, refunded cannot be cancelled.
  const canCancel = ["pending", "confirmed", "packed"].includes(order.status);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const billAddr = (order.billing_address as any) || null;

  const { activeReplacement, allReplacements } = await getReplacementForOrderQuery(
    order.id,
    order.order_number
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    status: order.status as OrderStatus,
    paymentMethod: order.payment_method as PaymentMethod,
    paymentStatus: order.payment_status as PaymentStatus,
    subtotal: Number(order.subtotal),
    shippingCharge: Number(order.shipping_charge),
    discountAmount: Number(order.discount_amount),
    codHandlingFee: codFee,
    totalAmount: Number(order.total_amount),
    couponCode: order.coupon_code,
    notes: extractCustomerNotes(order),
    cancelReason: order.cancel_reason,
    trackingNumber: extractTrackingInfo(order).trackingNumber,
    courierName: extractTrackingInfo(order).courierName,
    shiprocketOrderId: order.shiprocket_order_id ?? null,
    shiprocketShipmentId: order.shiprocket_shipment_id ?? null,
    razorpayPaymentId: order.razorpay_payment_id ?? null,
    razorpayRefundId: (order as Record<string, unknown>).razorpay_refund_id ? String((order as Record<string, unknown>).razorpay_refund_id) : null,
    refundStatus: ((order as Record<string, unknown>).refund_status as CustomerOrderDetail["refundStatus"]) ?? null,
    refundAmount: (order as Record<string, unknown>).refund_amount != null ? Number((order as Record<string, unknown>).refund_amount) : null,
    refundArn: (order as Record<string, unknown>).refund_arn ? String((order as Record<string, unknown>).refund_arn) : null,
    refundedAt: (order as Record<string, unknown>).refunded_at ? String((order as Record<string, unknown>).refunded_at) : null,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    shippingAddress: {
      fullName: shipAddr.fullName || "Valued Customer",
      phone: shipAddr.phone || "",
      email: shipAddr.email || "",
      addressLine1: shipAddr.addressLine1 || "",
      addressLine2: shipAddr.addressLine2 || null,
      city: shipAddr.city || "",
      state: shipAddr.state || "",
      pincode: shipAddr.pincode || "",
      addressType: shipAddr.addressType || "home",
    },
    billingAddress: billAddr
      ? {
          fullName: billAddr.fullName || shipAddr.fullName || "Valued Customer",
          phone: billAddr.phone || shipAddr.phone || "",
          email: billAddr.email || shipAddr.email || "",
          addressLine1: billAddr.addressLine1 || shipAddr.addressLine1 || "",
          addressLine2: billAddr.addressLine2 || null,
          city: billAddr.city || shipAddr.city || "",
          state: billAddr.state || shipAddr.state || "",
          pincode: billAddr.pincode || shipAddr.pincode || "",
          addressType: billAddr.addressType || "home",
        }
      : null,
    items,
    statusHistory,
    canCancel,
    replacement: activeReplacement,
    replacements: allReplacements,
  };
}


