import "server-only";

import React from "react";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/features/settings";
import {
  AdminNewOrderEmail,
  type AdminNewOrderEmailItem,
} from "../emails/admin-new-order-email";
import * as Sentry from "@sentry/nextjs";

export interface SendAdminOrderNotificationParams {
  orderNumber: string;
  orderDate?: string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: "paid" | "pending";
  items: AdminNewOrderEmailItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string | null;
  shippingCharge: number;
  codHandlingFee?: number;
  totalAmount: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  adminEmailOverride?: string;
}

/**
 * Dispatches an automated order notification email to the store admin / owner.
 *
 * Destination resolution priority:
 * 1. Explicit adminEmailOverride (if provided)
 * 2. ADMIN_NOTIFICATION_EMAIL environment variable
 * 3. Store Profile email configured in Admin Settings (siteSettings.storeProfile.email)
 *
 * CRITICAL RULE: Email dispatch failures MUST NEVER break or abort order creation or payment flows.
 */
export async function sendAdminOrderNotificationEmail(
  params: SendAdminOrderNotificationParams
): Promise<void> {
  try {
    const siteSettings = await getSiteSettings();
    const adminEmail = (
      params.adminEmailOverride ??
      (env.ADMIN_NOTIFICATION_EMAIL ||
        process.env.ADMIN_NOTIFICATION_EMAIL ||
        siteSettings.storeProfile.email ||
        "")
    ).trim();

    if (!adminEmail) {
      console.info(
        `[Email:AdminNotification] Skipped for order ${params.orderNumber}: No admin notification email configured in environment or store profile.`
      );
      return;
    }

    const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
    const adminOrderUrl = `${appUrl}/admin/orders/${params.orderNumber}`;
    const orderDate =
      params.orderDate ||
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const paymentLabel =
      params.paymentMethod === "cod" ? "COD" : "Paid (Razorpay)";

    const subject = `[New Order #${params.orderNumber}] ₹${params.totalAmount.toLocaleString(
      "en-IN"
    )} (${paymentLabel}) - ${params.customer.fullName}`;

    const itemsSummaryText = params.items
      .map(
        (it) =>
          `• ${it.title} x${it.quantity}${
            it.size ? ` [Size: ${it.size}]` : ""
          }${it.color ? ` [Color: ${it.color}]` : ""} = ₹${it.lineSubtotal.toLocaleString(
            "en-IN"
          )}`
      )
      .join("\n");

    const plainText = [
      `New Customer Order Received!`,
      ``,
      `Order Number: #${params.orderNumber}`,
      `Date: ${orderDate}`,
      `Payment: ${paymentLabel} (${params.paymentStatus === "paid" ? "Paid Online" : "Payable on Delivery"})`,
      `Total Amount: ₹${params.totalAmount.toLocaleString("en-IN")}`,
      ``,
      `Customer Details:`,
      `Name: ${params.customer.fullName}`,
      `Email: ${params.customer.email}`,
      `Phone: ${params.customer.phone}`,
      ``,
      `Delivery Address:`,
      `${params.shippingAddress.fullName}`,
      `${params.shippingAddress.addressLine1}${
        params.shippingAddress.addressLine2
          ? `, ${params.shippingAddress.addressLine2}`
          : ""
      }`,
      `${params.shippingAddress.city}, ${params.shippingAddress.state} - ${params.shippingAddress.pincode}`,
      `Phone: ${params.shippingAddress.phone}`,
      ``,
      `Items:`,
      itemsSummaryText,
      ``,
      `Pricing Breakdown:`,
      `Subtotal: ₹${params.subtotal.toLocaleString("en-IN")}`,
      params.discountAmount
        ? `Discount: -₹${params.discountAmount.toLocaleString("en-IN")}${
            params.couponCode ? ` (${params.couponCode})` : ""
          }`
        : null,
      `Shipping: ${
        params.shippingCharge === 0
          ? "FREE"
          : `₹${params.shippingCharge.toLocaleString("en-IN")}`
      }`,
      params.codHandlingFee
        ? `COD Fee: ₹${params.codHandlingFee.toLocaleString("en-IN")}`
        : null,
      `Total: ₹${params.totalAmount.toLocaleString("en-IN")}`,
      ``,
      `Manage this order in your Admin Portal:`,
      adminOrderUrl,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const result = await sendTransactionalEmail({
      to: adminEmail,
      subject,
      orderNumber: params.orderNumber,
      react: React.createElement(AdminNewOrderEmail, {
        orderNumber: params.orderNumber,
        orderDate,
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentStatus,
        items: params.items,
        subtotal: params.subtotal,
        discountAmount: params.discountAmount,
        couponCode: params.couponCode,
        shippingCharge: params.shippingCharge,
        codHandlingFee: params.codHandlingFee,
        totalAmount: params.totalAmount,
        customer: params.customer,
        shippingAddress: params.shippingAddress,
        adminOrderUrl,
      }),
      text: plainText,
    });

    if (!result.success) {
      console.warn(
        `[Email:AdminNotification:Warning] Admin email rejected for order ${params.orderNumber}:`,
        result.error
      );
    } else {
      console.info(
        `[Email:AdminNotification:Success] Dispatched admin alert for order ${params.orderNumber} to ${adminEmail}`
      );
    }
  } catch (error) {
    console.error(
      `[Email:AdminNotification:Exception] Unexpected error while sending admin notification for order ${params.orderNumber}:`,
      error
    );
    Sentry.captureException(error, {
      level: "warning",
      tags: { service: "admin-order-notification", orderNumber: params.orderNumber },
    });
  }
}
