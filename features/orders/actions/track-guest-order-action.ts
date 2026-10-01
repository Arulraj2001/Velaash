"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkTrackOrderRateLimit,
  recordFailedTrackOrderAttempt,
} from "@/lib/rate-limit";
import {
  maskEmail,
  maskPhoneNumber,
} from "@/features/checkout/utils/order-access-token";
import { extractTrackingInfo } from "@/features/admin/utils/order-metadata";
import type {
  OrderStatus,
  OrderStatusHistoryRecord,
  PaymentMethod,
  PaymentStatus,
} from "../types";

export interface GuestTrackOrderItem {
  id: string;
  title: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface GuestTrackOrderResult {
  success: boolean;
  error?: string;
  isRateLimited?: boolean;
  order?: {
    orderNumber: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    subtotal: number;
    shippingCharge: number;
    discountAmount: number;
    totalAmount: number;
    couponCode?: string | null;
    createdAt: string;
    trackingNumber: string | null;
    courierName: string | null;
    /** null = manually shipped; non-null = Shiprocket API-dispatched (enables live tracking) */
    shiprocketOrderId: string | null;
    statusHistory: OrderStatusHistoryRecord[];
    items: GuestTrackOrderItem[];
    maskedShipping: {
      maskedFullName: string;
      maskedPhone: string;
      maskedEmail: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
}

const GENERIC_NOT_FOUND_ERROR =
  "We couldn't find a matching order. Please check your details and try again.";

/**
 * Mask a full name: e.g. "Pooja Sharma" -> "P•••• S••••"
 */
function maskName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "Valued Customer";
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}${"•".repeat(Math.min(p.length - 1, 4))}` : p))
    .join(" ");
}

/**
 * Clean phone number to canonical 10 digits
 */
function cleanDigits(val: string): string {
  const digits = val.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Server action to look up an order for an unauthenticated guest.
 * Enforces rate limiting, anti-enumeration (identical error message for non-existence or mismatch),
 * and PII masking.
 */
export async function trackGuestOrderAction(
  orderNumber: string,
  identifier: string,
  testIp?: string
): Promise<GuestTrackOrderResult> {
  // 1. Resolve client IP for rate limiting
  let clientIp = testIp;
  if (!clientIp) {
    try {
      const headerList = await headers();
      clientIp =
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerList.get("x-real-ip")?.trim() ||
        "127.0.0.1";
    } catch {
      clientIp = "127.0.0.1";
    }
  }

  // 2. Check Rate Limit
  const rateLimitCheck = await checkTrackOrderRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      isRateLimited: true,
      error:
        rateLimitCheck.errorMessage ||
        "Too many failed tracking attempts. Please wait a few minutes before trying again or sign in to your account.",
    };
  }

  // 3. Validate input presence
  const cleanOrderNumber = (orderNumber || "").trim().toUpperCase();
  const cleanId = (identifier || "").trim();

  if (!cleanOrderNumber || !cleanId) {
    await recordFailedTrackOrderAttempt(clientIp);
    return {
      success: false,
      error: GENERIC_NOT_FOUND_ERROR,
    };
  }

  // 4. Lookup order via admin client
  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminSupabase = createAdminClient();
  } catch (err) {
    console.error("Failed to initialize admin Supabase client in trackGuestOrderAction:", err);
  }

  if (!adminSupabase) {
    await recordFailedTrackOrderAttempt(clientIp);
    return {
      success: false,
      error: GENERIC_NOT_FOUND_ERROR,
    };
  }

  const { data: order, error: orderErr } = await adminSupabase
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
      tracking_number,
      courier_name,
      shiprocket_order_id,
      shiprocket_shipment_id,
      created_at
    `)
    .eq("order_number", cleanOrderNumber)
    .maybeSingle();

  if (orderErr || !order) {
    // Record failed attempt and return generic error (anti-enumeration)
    await recordFailedTrackOrderAttempt(clientIp);
    return {
      success: false,
      error: GENERIC_NOT_FOUND_ERROR,
    };
  }

  // 5. Verify identity pair: Email OR Phone match
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ship = (order.shipping_address as any) || {};
  const orderEmail = (ship.email || "").trim().toLowerCase();
  const orderPhoneDigits = cleanDigits(ship.phone || "");

  const inputLower = cleanId.toLowerCase();
  const inputDigits = cleanDigits(cleanId);

  const emailMatches = Boolean(orderEmail && inputLower === orderEmail);
  const phoneMatches = Boolean(
    inputDigits.length >= 10 &&
    orderPhoneDigits.length >= 10 &&
    inputDigits === orderPhoneDigits
  );

  if (!emailMatches && !phoneMatches) {
    // Record failed attempt and return generic error (anti-enumeration)
    await recordFailedTrackOrderAttempt(clientIp);
    return {
      success: false,
      error: GENERIC_NOT_FOUND_ERROR,
    };
  }

  // 6. Fetch Items and Images
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

  const items: GuestTrackOrderItem[] = (itemsData || []).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vSnap = (item.variant_details_snapshot as any) || {};
    return {
      id: item.id,
      title: item.product_name_snapshot,
      size: vSnap.size || "Free Size",
      color: vSnap.color || "Standard",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      imageUrl: item.product_id ? imageMap[item.product_id] : undefined,
    };
  });

  // 7. Fetch Status History Timeline
  const { data: historyData } = await adminSupabase
    .from("order_status_history")
    .select("id, status, note, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const statusHistory: OrderStatusHistoryRecord[] = (historyData || []).map((h) => ({
    id: h.id,
    status: h.status as OrderStatus,
    note: h.note,
    createdAt: h.created_at,
  }));

  if (statusHistory.length === 0) {
    statusHistory.push({
      id: "synthetic-initial",
      status: order.status as OrderStatus,
      note: "Order placed successfully",
      createdAt: order.created_at,
    });
  }

  // 8. Extract Tracking Consignment & Courier Partner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackingInfo = extractTrackingInfo(order as any);

  // 9. Build Masked Response (PII protection for unauthenticated session)
  return {
    success: true,
    order: {
      orderNumber: order.order_number,
      status: order.status as OrderStatus,
      paymentMethod: order.payment_method as PaymentMethod,
      paymentStatus: order.payment_status as PaymentStatus,
      subtotal: Number(order.subtotal),
      shippingCharge: Number(order.shipping_charge),
      discountAmount: Number(order.discount_amount),
      totalAmount: Number(order.total_amount),
      couponCode: order.coupon_code,
      createdAt: order.created_at,
      trackingNumber: trackingInfo.trackingNumber,
      courierName: trackingInfo.courierName,
      shiprocketOrderId: order.shiprocket_order_id ?? null,
      statusHistory,
      items,
      maskedShipping: {
        maskedFullName: maskName(ship.fullName),
        maskedPhone: maskPhoneNumber(ship.phone),
        maskedEmail: maskEmail(ship.email),
        city: ship.city || "India",
        state: ship.state || "",
        pincode: ship.pincode || "",
      },
    },
  };
}
