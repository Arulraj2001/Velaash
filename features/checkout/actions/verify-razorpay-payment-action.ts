"use server";

import React from "react";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRazorpayPayment, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { generateOrderAccessToken } from "../utils/order-access-token";
import { MOCK_ORDERS_STORE } from "../queries/get-order-by-number";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { OrderConfirmationEmail } from "../emails/order-confirmation-email";
import { env } from "@/lib/env";
import { sendPaidOrderConfirmationEmail } from "../services/send-paid-order-confirmation";
import { getSiteSettings } from "@/features/settings";
import {
  VerifyRazorpayPaymentSchema,
  type VerifyRazorpayPaymentInput,
  type VerifyRazorpayPaymentResponse,
} from "../types";
import { formatDateIST } from "@/lib/utils";


export async function verifyRazorpayPaymentAction(
  rawInput: VerifyRazorpayPaymentInput
): Promise<VerifyRazorpayPaymentResponse> {
  // 1. Strict Runtime Input Validation
  const validationResult = VerifyRazorpayPaymentSchema.safeParse(rawInput);
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || "Invalid payment verification payload.",
      code: "SIGNATURE_VERIFICATION_FAILED",
    };
  }

  const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    validationResult.data;

  // 2. Cryptographic HMAC-SHA256 Signature Verification
  const isValidSignature = verifyRazorpayPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValidSignature) {
    console.error(
      `[SECURITY ALERT] Invalid Razorpay signature attempt for order ${orderNumber}. ` +
        `OrderId: ${razorpayOrderId}, PaymentId: ${razorpayPaymentId}`
    );
    const { storeProfile } = await getSiteSettings();
    return {
      success: false,
      error:
        `Payment verification failed. If your bank account was debited, please contact customer support ` +
        `at ${storeProfile.email} with reference "${orderNumber}".`,
      code: "SIGNATURE_VERIFICATION_FAILED",
    };
  }

  // 3. Update Database Order Record to 'paid' and 'confirmed'
  //
  // CALL-SITE JUSTIFICATION FOR ELEVATED SERVICE ROLE (Bypassing RLS):
  // 1. Order Status Transition: Unprivileged users and guests have NO UPDATE policy
  //    on 'orders' (per 20260929000007_orders_and_order_items.sql).
  //    Updating payment_status to 'paid' and status to 'confirmed' must ONLY happen
  //    via trusted server-side code following cryptographic verification.
  // 2. Audit Trail: Inserting audit records into 'order_status_history' requires admin privileges.
  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminSupabase = createAdminClient();
  } catch {
    // Database offline / mock fallback
  }

  if (adminSupabase) {
    try {
      // Find existing order
      const { data: order, error: findError } = await adminSupabase
        .from("orders")
        .select("id, status, payment_status, payment_method, total_amount, razorpay_order_id, razorpay_payment_id")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (findError || !order) {
        return {
          success: false,
          error: "Order could not be found for payment verification.",
          code: findError ? "INTERNAL_ERROR" : "ORDER_NOT_FOUND",
        };
      }

      if (
        order.payment_method !== "razorpay" ||
        order.razorpay_order_id !== razorpayOrderId
      ) {
        return {
          success: false,
          error: "Payment verification failed because the gateway order does not match this order.",
          code: "SIGNATURE_VERIFICATION_FAILED",
        };
      }

      if (order.payment_status === "paid") {
        if (["cancelled", "payment_failed", "refunded"].includes(order.status)) {
          return {
            success: false,
            error: "Payment was received after this order was closed. Please contact support for a refund update.",
            code: "ORDER_NOT_FOUND",
          };
        }

        if (order.razorpay_payment_id !== razorpayPaymentId) {
          return {
            success: false,
            error: "A different payment has already been recorded for this order.",
            code: "SIGNATURE_VERIFICATION_FAILED",
          };
        }

        const accessToken = generateOrderAccessToken(orderNumber);
        return {
          success: true,
          orderNumber,
          isAlreadyProcessed: true,
          accessToken,
        };
      }

      if (order.payment_status !== "pending" || order.status !== "pending") {
        return {
          success: false,
          error: "This order is no longer eligible for payment verification.",
          code: "ORDER_NOT_FOUND",
        };
      }

      let payment;
      try {
        payment = await fetchRazorpayPayment(razorpayPaymentId);
      } catch (paymentLookupError) {
        console.warn(
          `[Checkout] Razorpay payment lookup pending for payment ${razorpayPaymentId} (order ${orderNumber}):`,
          paymentLookupError
        );
        return {
          success: false,
          error:
            "Your payment is being confirmed by your bank. Please do not refresh — this page will automatically update in a few seconds.",
          code: "PAYMENT_PENDING_WEBHOOK",
        };
      }

      if (
        payment.id !== razorpayPaymentId ||
        payment.order_id !== razorpayOrderId ||
        payment.currency !== "INR" ||
        payment.amount !== Math.round(Number(order.total_amount) * 100)
      ) {
        return {
          success: false,
          error: "Payment details do not match this order. Please contact support if your account was debited.",
          code: "SIGNATURE_VERIFICATION_FAILED",
        };
      }

      if (payment.status !== "captured" || payment.captured !== true) {
        return {
          success: false,
          error: "Payment is still being confirmed by Razorpay. Your order remains pending; please retry shortly and do not pay again if your account was debited.",
          code: "PAYMENT_NOT_CAPTURED",
        };
      }

        // Update order status to paid and confirmed
        const { data: updatedOrder, error: updateError } = await adminSupabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          })
          .eq("id", order.id)
          .eq("razorpay_order_id", razorpayOrderId)
          .eq("payment_status", "pending")
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

        if (updateError) {
          return {
            success: false,
            error: "Payment verification could not be saved. Please contact support if you were charged.",
            code: "INTERNAL_ERROR",
          };
        }

        if (!updatedOrder) {
          const { data: latestOrder, error: latestError } = await adminSupabase
            .from("orders")
            .select("payment_status, razorpay_order_id, razorpay_payment_id")
            .eq("id", order.id)
            .maybeSingle();

          if (
            !latestError &&
            latestOrder?.payment_status === "paid" &&
            latestOrder.razorpay_order_id === razorpayOrderId &&
            latestOrder.razorpay_payment_id === razorpayPaymentId
          ) {
            return {
              success: true,
              orderNumber,
              isAlreadyProcessed: true,
              accessToken: generateOrderAccessToken(orderNumber),
            };
          }

          return {
            success: false,
            error: "This order changed while payment was being verified. Please contact support if you were charged.",
            code: latestError ? "INTERNAL_ERROR" : "ORDER_NOT_FOUND",
          };
        }

        // Record immutable audit history
        await adminSupabase.from("order_status_history").insert({
          order_id: order.id,
          status: "confirmed",
          note: `Payment verified via Razorpay client callback. Payment ID: ${razorpayPaymentId}`,
        });

        // 4. Generate Access Token & Set Cookie for Order Confirmation
        const accessToken = generateOrderAccessToken(orderNumber);
        try {
          const cookieStore = await cookies();
          cookieStore.set(`velaash_order_access_${orderNumber}`, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1800,
            sameSite: "lax",
            path: "/",
          });
        } catch {
          // Outside request context
        }

        const mockOrder = MOCK_ORDERS_STORE.get(orderNumber);
        if (mockOrder) {
          mockOrder.paymentStatus = "paid";
          mockOrder.status = "confirmed";
        }

        await sendPaidOrderConfirmationEmail(adminSupabase, orderNumber);

        return {
          success: true,
          orderNumber,
          accessToken,
        };
    } catch (dbErr) {
      console.error("Database error during payment verification:", dbErr);
      return {
        success: false,
        error: "Payment verification could not be saved. Please contact support if you were charged.",
        code: "INTERNAL_ERROR",
      };
    }
  }

  // Fallback update for mock/test environments
  const mockOrder = MOCK_ORDERS_STORE.get(orderNumber);
  if (
    process.env.NODE_ENV === "production" ||
    !mockOrder ||
    mockOrder.paymentMethod !== "razorpay" ||
    mockOrder.razorpayOrderId !== razorpayOrderId ||
    mockOrder.status !== "pending" ||
    mockOrder.paymentStatus !== "pending"
  ) {
    return {
      success: false,
      error: "Order could not be found for payment verification.",
      code: "ORDER_NOT_FOUND",
    };
  }

  mockOrder.paymentStatus = "paid";
  mockOrder.status = "confirmed";
  mockOrder.razorpayPaymentId = razorpayPaymentId;

  const accessToken = generateOrderAccessToken(orderNumber);
  try {
    const cookieStore = await cookies();
    cookieStore.set(`velaash_order_access_${orderNumber}`, accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 1800,
      sameSite: "lax",
      path: "/",
    });
  } catch {
    // Outside request context
  }

  if (mockOrder) {
    try {
      const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
      const orderViewUrl = `${appUrl}/order-confirmation/${orderNumber}?token=${accessToken}`;
      await sendTransactionalEmail({
        to: mockOrder.shippingAddress.email,
        subject: `Payment Confirmed: ${orderNumber} - Velaash`,
        orderNumber,
        react: React.createElement(OrderConfirmationEmail, {
          orderNumber,
          customerName: mockOrder.shippingAddress.fullName,
          orderDate: formatDateIST(mockOrder.createdAt || new Date()),
          paymentMethod: "razorpay",
          paymentStatus: "paid",
          items: mockOrder.items.map((it) => ({
            title: it.title,
            size: it.size,
            color: it.color,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineSubtotal: it.subtotal,
          })),
          subtotal: mockOrder.subtotal,
          discountAmount: mockOrder.discountAmount,
          couponCode: mockOrder.couponCode,
          shippingCharge: mockOrder.shippingCharge,
          codHandlingFee: 0,
          totalAmount: mockOrder.totalAmount,
          shippingAddress: mockOrder.shippingAddress,
          orderViewUrl,
          supportEmail: (await getSiteSettings()).storeProfile.email,
        }),
      });

    } catch (emailErr) {
      console.error(`[Email:Error] Online confirmation email failed for ${orderNumber}:`, emailErr);
    }
  }

  return {
    success: true,
    orderNumber,
    accessToken,
  };
}
