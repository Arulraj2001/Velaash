"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "../utils/track";
import type { OrderDetail } from "@/features/checkout/queries/get-order-by-number";

interface OrderConfirmationTrackerProps {
  order: OrderDetail;
}

export function OrderConfirmationTracker({ order }: OrderConfirmationTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    trackPurchase({
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      subtotal: order.subtotal,
      shipping: order.shippingCharge,
      coupon: order.couponCode || undefined,
      currency: "INR",
      items: order.items.map((item) => ({
        id: item.variantId || item.id,
        productId: item.productId,
        title: item.title,
        price: item.unitPrice,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
    });
  }, [order]);

  return null;
}
