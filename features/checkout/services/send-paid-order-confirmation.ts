import "server-only";

import React from "react";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/features/settings";
import { OrderConfirmationEmail } from "../emails/order-confirmation-email";
import { generateOrderAccessToken } from "../utils/order-access-token";
import type { createAdminClient } from "@/lib/supabase/admin";

export async function sendPaidOrderConfirmationEmail(
  adminSupabase: ReturnType<typeof createAdminClient>,
  orderNumber: string
): Promise<void> {
  try {
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .select(
        "id, order_number, payment_method, payment_status, subtotal, shipping_charge, discount_amount, total_amount, shipping_address, coupon_code, created_at"
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError || !order || order.payment_status !== "paid") {
      console.error(`[Email:Error] Could not load paid order ${orderNumber} for confirmation.`);
      return;
    }

    const { data: orderItems, error: itemsError } = await adminSupabase
      .from("order_items")
      .select("product_name_snapshot, variant_details_snapshot, unit_price, quantity, subtotal")
      .eq("order_id", order.id);

    if (itemsError || !orderItems) {
      console.error(`[Email:Error] Could not load items for paid order ${orderNumber}.`);
      return;
    }

    const storedAddress = (order.shipping_address || {}) as Record<string, unknown>;
    const recipientEmail = typeof storedAddress.email === "string" ? storedAddress.email : "";
    if (!recipientEmail) {
      console.error(`[Email:Error] Paid order ${orderNumber} has no customer email address.`);
      return;
    }

    const shippingAddress = {
      fullName: typeof storedAddress.fullName === "string" ? storedAddress.fullName : "Customer",
      phone: typeof storedAddress.phone === "string" ? storedAddress.phone : "",
      addressLine1: typeof storedAddress.addressLine1 === "string" ? storedAddress.addressLine1 : "",
      addressLine2:
        typeof storedAddress.addressLine2 === "string" ? storedAddress.addressLine2 : null,
      city: typeof storedAddress.city === "string" ? storedAddress.city : "",
      state: typeof storedAddress.state === "string" ? storedAddress.state : "",
      pincode: typeof storedAddress.pincode === "string" ? storedAddress.pincode : "",
    };
    const { storeProfile } = await getSiteSettings();
    const accessToken = generateOrderAccessToken(orderNumber);
    const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
    const orderViewUrl = `${appUrl}/order-confirmation/${orderNumber}?token=${accessToken}`;

    await sendTransactionalEmail({
      to: recipientEmail,
      subject: `Payment Confirmed: ${orderNumber} - Velaash`,
      orderNumber,
      react: React.createElement(OrderConfirmationEmail, {
        orderNumber,
        customerName: shippingAddress.fullName || "Customer",
        orderDate: new Date(order.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        items: orderItems.map((item) => {
          const variant = (item.variant_details_snapshot || {}) as Record<string, string>;
          return {
            title: item.product_name_snapshot,
            size: variant.size || "Standard",
            color: variant.color || "Default",
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            lineSubtotal: Number(item.subtotal),
          };
        }),
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discount_amount),
        couponCode: order.coupon_code || undefined,
        shippingCharge: Number(order.shipping_charge),
        codHandlingFee: 0,
        totalAmount: Number(order.total_amount),
        shippingAddress,
        orderViewUrl,
        supportEmail: storeProfile.email,
      }),
    });
  } catch (error) {
    console.error(`[Email:Error] Paid order confirmation failed for ${orderNumber}:`, error);
  }
}