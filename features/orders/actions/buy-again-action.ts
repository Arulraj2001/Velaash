"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth";
import type { AddItemInput } from "@/features/cart/store/cart-store";

export interface BuyAgainItemPayload {
  item: AddItemInput;
  quantity: number;
}

export interface BuyAgainResult {
  success: boolean;
  orderNumber?: string;
  availableItems: BuyAgainItemPayload[];
  unavailableItems: string[];
  totalItems: number;
  error?: string;
}

/**
 * Server Action for "Buy Again":
 * Retrieves line items from a past order, checks if the EXACT variants (size & color)
 * are still active and in stock in the current catalog, and returns the valid payloads
 * ready to be added to the customer's shopping bag.
 */
export async function getBuyAgainItemsAction(orderId: string): Promise<BuyAgainResult> {
  if (!orderId) {
    return {
      success: false,
      availableItems: [],
      unavailableItems: [],
      totalItems: 0,
      error: "Order ID is required.",
    };
  }

  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return {
      success: false,
      availableItems: [],
      unavailableItems: [],
      totalItems: 0,
      error: "Please sign in to reorder items.",
    };
  }

  const { user } = authData;

  let adminSupabase: ReturnType<typeof createAdminClient>;
  try {
    adminSupabase = createAdminClient();
  } catch (err) {
    console.error("[getBuyAgainItemsAction] Failed to init admin client:", err);
    return {
      success: false,
      availableItems: [],
      unavailableItems: [],
      totalItems: 0,
      error: "Service unavailable.",
    };
  }

  // 1. Fetch Order and verify ownership
  const { data: order, error: orderErr } = await adminSupabase
    .from("orders")
    .select("id, order_number, customer_id, shipping_address")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return {
      success: false,
      availableItems: [],
      unavailableItems: [],
      totalItems: 0,
      error: "Order not found.",
    };
  }

  // Strict ownership check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipAddr = (order.shipping_address as any) || {};
  const isOwner =
    order.customer_id === user.id ||
    (user.email && shipAddr.email && user.email.toLowerCase() === shipAddr.email.toLowerCase());

  if (!isOwner) {
    return {
      success: false,
      availableItems: [],
      unavailableItems: [],
      totalItems: 0,
      error: "Unauthorized.",
    };
  }

  // 2. Fetch order items
  const { data: orderItems, error: itemsErr } = await adminSupabase
    .from("order_items")
    .select("id, product_id, variant_id, product_name_snapshot, quantity")
    .eq("order_id", order.id);

  if (itemsErr || !orderItems || orderItems.length === 0) {
    return {
      success: false,
      availableItems: [],
      unavailableItems: [],
      totalItems: 0,
      error: "No items found in this order.",
    };
  }

  const availableItems: BuyAgainItemPayload[] = [];
  const unavailableItems: string[] = [];

  // 3. Check current catalog status for each order item
  for (const item of orderItems) {
    if (!item.product_id || !item.variant_id) {
      unavailableItems.push(item.product_name_snapshot || "Item");
      continue;
    }

    // Verify parent product is active
    const { data: product } = await adminSupabase
      .from("products")
      .select("id, name, slug, base_price, compare_at_price, is_active, stock_status")
      .eq("id", item.product_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!product || product.stock_status === "out_of_stock") {
      unavailableItems.push(item.product_name_snapshot || "Item");
      continue;
    }

    // Verify variant is active and has stock
    const { data: variant } = await adminSupabase
      .from("product_variants")
      .select("id, size, color, color_hex, stock_quantity, price_override, is_active")
      .eq("id", item.variant_id)
      .eq("product_id", product.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!variant || (variant.stock_quantity || 0) <= 0) {
      unavailableItems.push(item.product_name_snapshot || product.name);
      continue;
    }

    // Fetch primary product image
    const { data: imgData } = await adminSupabase
      .from("product_images")
      .select("image_url, is_primary")
      .eq("product_id", product.id)
      .order("is_primary", { ascending: false })
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const price =
      typeof variant.price_override === "number" && variant.price_override > 0
        ? variant.price_override
        : Number(product.base_price);

    const qtyToAdd = Math.min(item.quantity || 1, variant.stock_quantity);

    availableItems.push({
      item: {
        productId: product.id,
        variantId: variant.id,
        title: product.name,
        slug: product.slug,
        size: variant.size,
        color: variant.color,
        colorHex: variant.color_hex || undefined,
        price,
        compareAtPrice: product.compare_at_price ? Number(product.compare_at_price) : null,
        image: imgData?.image_url || "/logo.png",
        maxStock: variant.stock_quantity,
      },
      quantity: qtyToAdd,
    });
  }

  return {
    success: true,
    orderNumber: order.order_number,
    availableItems,
    unavailableItems,
    totalItems: orderItems.length,
  };
}
