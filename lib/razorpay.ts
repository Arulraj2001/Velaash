import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * ==============================================================================
 * Razorpay Payment Gateway Service
 * Server-Side Authoritative Order Creation & Cryptographic Signature Verification
 * ==============================================================================
 */

export interface CreateRazorpayOrderParams {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPaymentResult {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
}

/**
 * Creates an authoritative Razorpay Order via the Razorpay Orders API.
 * The amount is STRICTLY passed in paise (1 INR = 100 paise) derived from
 * server-calculated authoritative cart totals.
 */
export async function createRazorpayOrder({
  amountPaise,
  receipt,
  notes = {},
}: CreateRazorpayOrderParams): Promise<RazorpayOrderResult> {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error(
      `Invalid order amount: ${amountPaise}. Amount must be a positive integer in paise.`
    );
  }

  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  const isPlaceholderKey =
    !keyId ||
    !keySecret ||
    keyId.includes("placeholder") ||
    keySecret.includes("placeholder") ||
    keyId.startsWith("rzp_test_placeholder");

  // In local test/mock mode without active Razorpay account credentials,
  // return a structured mock order so offline development & test suites function seamlessly.
  if (isPlaceholderKey) {
    const sanitizedReceipt = receipt.replace(/[^a-zA-Z0-9]/g, "");
    return {
      id: `order_mock_${sanitizedReceipt}_${Date.now().toString().slice(-6)}`,
      amount: amountPaise,
      currency: "INR",
      receipt,
    };
  }

  // Live Razorpay Orders API call
  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Razorpay Orders API error response:", errorBody);
    throw new Error(`Razorpay order creation failed: ${response.statusText}`);
  }

  const orderData = (await response.json()) as {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };

  return {
    id: orderData.id,
    amount: orderData.amount,
    currency: orderData.currency,
    receipt: orderData.receipt,
  };
}

export async function fetchRazorpayPayment(
  paymentId: string
): Promise<RazorpayPaymentResult> {
  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (
    !keyId ||
    !keySecret ||
    keyId.toLowerCase().includes("placeholder") ||
    keySecret.toLowerCase().includes("placeholder")
  ) {
    throw new Error("Razorpay API credentials are not configured.");
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Basic ${authHeader}` } }
  );

  if (!response.ok) {
    throw new Error(`Razorpay payment lookup failed with status ${response.status}.`);
  }

  return (await response.json()) as RazorpayPaymentResult;
}

/**
 * Cryptographically verifies the payment signature sent by the client upon
 * successful Razorpay checkout modal completion.
 *
 * Formula: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret) === razorpay_signature
 * Uses timingSafeEqual to guard against timing analysis attacks.
 */
export function verifyRazorpayPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  secretOverride,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secretOverride?: string;
}): boolean {
  const secret = secretOverride || env.RAZORPAY_KEY_SECRET;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !secret) {
    return false;
  }

  try {
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpaySignature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error("Error verifying Razorpay payment signature:", err);
    return false;
  }
}

/**
 * Cryptographically verifies the webhook signature received from Razorpay servers.
 *
 * Formula: HMAC-SHA256(raw_request_body, webhook_secret) === X-Razorpay-Signature
 * Uses timingSafeEqual to guard against timing analysis attacks.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  webhookSecretOverride,
}: {
  rawBody: string;
  signature: string;
  webhookSecretOverride?: string;
}): boolean {
  const secret = webhookSecretOverride || env.RAZORPAY_WEBHOOK_SECRET;

  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error("Error verifying Razorpay webhook signature:", err);
    return false;
  }
}

export interface CreateRazorpayRefundParams {
  paymentId: string;
  amountPaise?: number;
  speed?: "normal" | "optimum";
  notes?: Record<string, string>;
  receipt?: string;
}

export interface RazorpayRefundResult {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: "pending" | "processed" | "failed";
  speed: string;
  created_at: number;
  arn?: string | null;
}

/**
 * Initiates an authoritative refund via Razorpay's Payments Refund API.
 * (POST https://api.razorpay.com/v1/payments/{payment_id}/refund)
 */
export async function createRazorpayRefund({
  paymentId,
  amountPaise,
  speed = "normal",
  notes = {},
  receipt,
}: CreateRazorpayRefundParams): Promise<RazorpayRefundResult> {
  if (!paymentId) {
    throw new Error("Razorpay paymentId is required to process a refund.");
  }

  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  const isPlaceholderKey =
    !keyId ||
    !keySecret ||
    keyId.includes("placeholder") ||
    keySecret.includes("placeholder") ||
    keyId.startsWith("rzp_test_placeholder");

  const isMockPaymentId =
    paymentId.startsWith("pay_mock_") ||
    paymentId.startsWith("pay_test_") ||
    paymentId === "pay_dummy";

  // In test/mock mode without active Razorpay account credentials,
  // or when using mock payment IDs during development/testing,
  // return a mock refund so local flows and test suites operate reliably.
  if (isPlaceholderKey || (process.env.NODE_ENV !== "production" && isMockPaymentId)) {
    const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9]/g, "");
    return {
      id: `rfnd_mock_${sanitizedPaymentId}_${Date.now().toString().slice(-6)}`,
      payment_id: paymentId,
      amount: amountPaise ?? 0,
      currency: "INR",
      status: "processed",
      speed,
      created_at: Math.floor(Date.now() / 1000),
      arn: `MOCK_ARN_${Date.now().toString().slice(-8)}`,
    };
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const requestBody: Record<string, unknown> = {
    speed,
    notes,
  };

  if (amountPaise && Number.isInteger(amountPaise) && amountPaise > 0) {
    requestBody.amount = amountPaise;
  }
  if (receipt) {
    requestBody.receipt = receipt;
  }

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Razorpay Refund API error response:", errorBody);
    throw new Error(`Razorpay refund failed: ${response.statusText} (${response.status})`);
  }

  const refundData = (await response.json()) as RazorpayRefundResult;
  return refundData;
}

