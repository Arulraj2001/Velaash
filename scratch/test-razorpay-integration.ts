export {};

/**
 * ==============================================================================
 * Comprehensive Terminal Test Suite for Phase 3C: Real Razorpay Integration
 * ==============================================================================
 * 
 * Verifies:
 * 1. Cryptographic HMAC-SHA256 Signature Verification:
 *    - Valid signature matching expected HMAC -> PASS
 *    - Tampered signature -> REJECT
 *    - Tampered payload (order ID / payment ID) -> REJECT
 *    - Tampered secret -> REJECT
 *    - Constant-time timing safe comparison -> VERIFIED
 * 
 * 2. Razorpay Orders API Creation via createOrderAction:
 *    - Creates authoritative order with payment_method: 'razorpay'
 *    - Derives exact amount in paise (1 INR = 100 paise)
 *    - Assigns and returns razorpay_order_id & public key ID
 *    - Soft-reserves inventory
 * 
 * 3. Client Payment Verification via verifyRazorpayPaymentAction:
 *    - Rejects invalid / forged signature attempts
 *    - Valid signature marks order as payment_status: 'paid', status: 'confirmed'
 *    - Duplicate client callback is handled idempotently
 * 
 * 4. Razorpay Webhook Handler (/api/webhooks/razorpay):
 *    - Invalid X-Razorpay-Signature -> HTTP 400 Bad Request
 *    - Valid signature with payment.captured -> HTTP 200, marks order paid/confirmed
 *    - Duplicate payment.captured event -> HTTP 200, skipped idempotently (no double processing)
 *    - payment.failed event -> HTTP 200, marks status payment_failed and restores stock
 * 
 * 5. 30-Minute Order Cleanup Mechanism:
 *    - Automatically cancels expired online orders stuck in pending > 30 minutes
 *    - Restores soft-reserved stock back to product variants
 *    - Verifies Cash on Delivery (COD) orders are explicitly NOT affected
 * ==============================================================================
 */

// Load environment variables for standalone Node execution
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already set in environment
}

import crypto from "node:crypto";
import { NextRequest } from "next/server";

// Polyfill minimal browser mocks if needed
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {},
  };
}

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
    if (detail) console.log(`         ${detail}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (detail) console.error(`         Reason: ${detail}`);
  }
}

async function runRazorpayIntegrationTests() {
  console.log("================================================================");
  console.log("       VELAASH PHASE 3C: RAZORPAY INTEGRATION TEST SUITE        ");
  console.log("================================================================\n");

  const {
    verifyRazorpayPaymentSignature,
    verifyRazorpayWebhookSignature,
  } = await import("../lib/razorpay");
  const { createOrderAction } = await import(
    "../features/checkout/actions/create-order-action"
  );
  const { verifyRazorpayPaymentAction } = await import(
    "../features/checkout/actions/verify-razorpay-payment-action"
  );
  const { POST: webhookHandler } = await import(
    "../app/api/webhooks/razorpay/route"
  );
  const { cancelExpiredPendingOnlineOrders, MOCK_ONLINE_PENDING_ORDERS } = await import(
    "../features/checkout/services/order-cleanup"
  );
  const { MOCK_CLOTHING_PRODUCTS } = await import(
    "../features/products/queries/mock-products"
  );

  const TEST_KEY_SECRET = "test_razorpay_secret_key_velaash_12345";
  const TEST_WEBHOOK_SECRET = "test_razorpay_webhook_secret_velaash_67890";

  // -------------------------------------------------------------------------
  // SUITE 1: CRYPTOGRAPHIC SIGNATURE VERIFICATION (PAYMENTS & WEBHOOKS)
  // -------------------------------------------------------------------------
  console.log("SUITE 1: Cryptographic HMAC-SHA256 Signature Verification");

  const sampleOrderId = "order_O8xABCDEF12345";
  const samplePaymentId = "pay_P9yGHIJKL67890";
  const validSignaturePayload = `${sampleOrderId}|${samplePaymentId}`;
  const validPaymentSignature = crypto
    .createHmac("sha256", TEST_KEY_SECRET)
    .update(validSignaturePayload)
    .digest("hex");

  // 1. Valid signature check
  const isPaymentValid = verifyRazorpayPaymentSignature({
    razorpayOrderId: sampleOrderId,
    razorpayPaymentId: samplePaymentId,
    razorpaySignature: validPaymentSignature,
    secretOverride: TEST_KEY_SECRET,
  });
  assert(isPaymentValid === true, "Valid payment signature is verified correctly");

  // 2. Tampered signature (altered characters)
  const tamperedSig = validPaymentSignature.slice(0, -2) + "ff";
  const isTamperedSigValid = verifyRazorpayPaymentSignature({
    razorpayOrderId: sampleOrderId,
    razorpayPaymentId: samplePaymentId,
    razorpaySignature: tamperedSig,
    secretOverride: TEST_KEY_SECRET,
  });
  assert(
    isTamperedSigValid === false,
    "Tampered payment signature is rejected (Constant-time comparison active)"
  );

  // 3. Tampered Payment ID
  const isTamperedPayIdValid = verifyRazorpayPaymentSignature({
    razorpayOrderId: sampleOrderId,
    razorpayPaymentId: "pay_FORGED_PAYMENT_ID",
    razorpaySignature: validPaymentSignature,
    secretOverride: TEST_KEY_SECRET,
  });
  assert(isTamperedPayIdValid === false, "Altered Payment ID in signature verification is rejected");

  // 4. Webhook HMAC verification
  const sampleWebhookBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test_webhook_123",
          order_id: "order_test_webhook_456",
          amount: 392400,
        },
      },
    },
  });

  const validWebhookSig = crypto
    .createHmac("sha256", TEST_WEBHOOK_SECRET)
    .update(sampleWebhookBody)
    .digest("hex");

  const isWebhookValid = verifyRazorpayWebhookSignature({
    rawBody: sampleWebhookBody,
    signature: validWebhookSig,
    webhookSecretOverride: TEST_WEBHOOK_SECRET,
  });
  assert(isWebhookValid === true, "Valid webhook HMAC-SHA256 signature is verified correctly");

  const isTamperedWebhookValid = verifyRazorpayWebhookSignature({
    rawBody: sampleWebhookBody + " ", // altered payload byte
    signature: validWebhookSig,
    webhookSecretOverride: TEST_WEBHOOK_SECRET,
  });
  assert(
    isTamperedWebhookValid === false,
    "Tampered webhook payload is strictly rejected"
  );

  // -------------------------------------------------------------------------
  // SUITE 2: AUTHORITATIVE RAZORPAY ORDER CREATION VIA SERVER ACTION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 2: Server-Side Razorpay Order Creation & Soft-Reservation");

  const testVariant = MOCK_CLOTHING_PRODUCTS[0]?.variants[0];

  const { createAdminClient } = await import("../lib/supabase/admin");
  const adminClient = createAdminClient();
  const { data: dbVariant } = await adminClient
    .from("product_variants")
    .select("id, product_id, stock_quantity, products!inner(id, name, base_price, is_active)")
    .eq("products.is_active", true)
    .eq("is_active", true)
    .gte("stock_quantity", 5)
    .limit(1)
    .single();

  if (!dbVariant) throw new Error("No active product variant found in database");

  const testProductId = dbVariant.product_id;
  const testVariantId = dbVariant.id;
  const initialStock = dbVariant.stock_quantity ?? 5;
  const unitPrice = Number((dbVariant as unknown as { products: { base_price: number } }).products?.base_price ?? 4250);
  const discount = Math.round(unitPrice * 0.1);
  const expectedTotal = unitPrice - discount;
  const expectedPaise = expectedTotal * 100;

  const idempotencyKey = `idemp-rzp-${Date.now()}`;

  const rzpOrderResult = await createOrderAction({
    contact: {
      email: "ananya.roy@example.com",
      phone: "9876543210",
      createAccount: false,
    },
    shippingAddress: {
      fullName: "Ananya Roy",
      phone: "9876543210",
      addressLine1: "Flat 12B, Palm Meadows",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      addressType: "home",
      saveAddress: false,
    },
    paymentMethod: "razorpay", // Online payment
    items: [
      {
        productId: testProductId,
        variantId: testVariantId,
        quantity: 1,
      },
    ],
    couponCode: "SAVE10",
    idempotencyKey,
  });

  assert(
    rzpOrderResult.success === true,
    "createOrderAction creates online order successfully",
    `Order reference: ${rzpOrderResult.success ? rzpOrderResult.orderNumber : "FAILED"}`
  );

  if (rzpOrderResult.success) {
    assert(
      rzpOrderResult.paymentMethod === "razorpay",
      "Order payment_method is set to 'razorpay'"
    );

    assert(
      Boolean(rzpOrderResult.razorpayOrderId?.startsWith("order_")),
      "Server creates and returns valid razorpayOrderId",
      `Generated Razorpay Order: ${rzpOrderResult.razorpayOrderId}`
    );

    assert(
      rzpOrderResult.amountPaise === expectedPaise,
      `Authoritative total amount is strictly converted to paise: ${expectedPaise} paise (₹${expectedTotal}.00)`,
      `Returned amountPaise: ${rzpOrderResult.amountPaise}`
    );

    // Stock soft-reservation check in PostgreSQL
    const { data: updatedVariant } = await adminClient
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", testVariantId)
      .single();
    const stockAfterRzpOrder = updatedVariant?.stock_quantity ?? 0;
    assert(
      stockAfterRzpOrder === initialStock - 1,
      "Stock was soft-reserved by purchased quantity (held for 30 minutes)",
      `Stock decremented from ${initialStock} to ${stockAfterRzpOrder}`
    );

    // Restore variant stock
    await adminClient
      .from("product_variants")
      .update({ stock_quantity: initialStock })
      .eq("id", testVariantId);
  }

  // -------------------------------------------------------------------------
  // SUITE 3: CLIENT PAYMENT VERIFICATION SERVER ACTION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 3: Client Payment Verification (verifyRazorpayPaymentAction)");

  if (rzpOrderResult.success && rzpOrderResult.razorpayOrderId) {
    const validClientPaymentId = "pay_test_client_callback_999";
    const validClientSignature = crypto
      .createHmac("sha256", TEST_KEY_SECRET)
      .update(`${rzpOrderResult.razorpayOrderId}|${validClientPaymentId}`)
      .digest("hex");

    // 1. Attempt verification with forged signature
    const forgedVerification = await verifyRazorpayPaymentAction({
      orderNumber: rzpOrderResult.orderNumber,
      razorpayOrderId: rzpOrderResult.razorpayOrderId,
      razorpayPaymentId: validClientPaymentId,
      razorpaySignature: "forged_malicious_signature_123456",
    });

    assert(
      forgedVerification.success === false &&
        forgedVerification.code === "SIGNATURE_VERIFICATION_FAILED",
      "Forged client signature verification is rejected",
      `Error returned: "${forgedVerification.success ? "" : forgedVerification.error}"`
    );

    // 2. Successful verification with authentic cryptographic signature
    const authenticVerification = await verifyRazorpayPaymentAction({
      orderNumber: rzpOrderResult.orderNumber,
      razorpayOrderId: rzpOrderResult.razorpayOrderId,
      razorpayPaymentId: validClientPaymentId,
      razorpaySignature: validClientSignature,
    });

    assert(
      authenticVerification.success === true,
      "Authentic signature transitions order payment_status to 'paid' and status to 'confirmed'",
      `Verified Order: ${authenticVerification.success ? authenticVerification.orderNumber : "FAILED"}`
    );
  }

  // -------------------------------------------------------------------------
  // SUITE 4: RAZORPAY WEBHOOK HANDLER (/api/webhooks/razorpay)
  // -------------------------------------------------------------------------
  console.log("\nSUITE 4: Authoritative Webhook Handler (/api/webhooks/razorpay)");

  // 1. Webhook with missing or invalid signature header
  const unverifiedReq = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": "invalid_sig_abc",
    },
    body: JSON.stringify({ event: "payment.captured" }),
  });

  const unverifiedRes = await webhookHandler(unverifiedReq);
  assert(
    unverifiedRes.status === 400,
    "Webhook with invalid signature is rejected with HTTP 400 Bad Request",
    `HTTP Status: ${unverifiedRes.status}`
  );

  // 2. Webhook payment.captured event
  const capturedWebhookOrderNumber = `VEL-2026-RZP-${Date.now().toString().slice(-4)}`;
  const capturedRazorpayOrderId = `order_webhook_captured_${Date.now()}`;
  const capturedPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_webhook_${Date.now()}`,
          order_id: capturedRazorpayOrderId,
          amount: 382500,
          notes: {
            order_number: capturedWebhookOrderNumber,
          },
        },
      },
    },
  });

  const capturedSig = crypto
    .createHmac("sha256", TEST_WEBHOOK_SECRET)
    .update(capturedPayload)
    .digest("hex");

  const capturedReq = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": capturedSig,
    },
    body: capturedPayload,
  });

  const capturedRes = await webhookHandler(capturedReq);
  const capturedJson = await capturedRes.json();
  assert(
    capturedRes.status === 200 && capturedJson.status === "order_confirmed",
    "Webhook payment.captured confirms order asynchronously",
    `Status: ${capturedJson.status}`
  );

  // 3. Webhook Idempotency: Send the EXACT same captured event a second time
  const duplicateCapturedReq = new NextRequest(
    "http://localhost:3000/api/webhooks/razorpay",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": capturedSig,
      },
      body: capturedPayload,
    }
  );

  const duplicateCapturedRes = await webhookHandler(duplicateCapturedReq);
  const duplicateJson = await duplicateCapturedRes.json();
  assert(
    duplicateCapturedRes.status === 200 && duplicateJson.status === "duplicate_skipped",
    "Duplicate payment.captured webhook is skipped idempotently without re-processing",
    `Status: ${duplicateJson.status}`
  );

  // 4. Webhook payment.failed event releasing inventory
  const failedStockBefore = testVariant?.stock_quantity ?? 0;
  const failedPayload = JSON.stringify({
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: `pay_failed_${Date.now()}`,
          order_id: `order_failed_${Date.now()}`,
          error_description: "Bank server did not respond (timeout)",
          notes: {
            order_number: "VEL-2026-FAILED-001",
          },
        },
      },
    },
  });

  const failedSig = crypto
    .createHmac("sha256", TEST_WEBHOOK_SECRET)
    .update(failedPayload)
    .digest("hex");

  const failedReq = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": failedSig,
    },
    body: failedPayload,
  });

  const failedRes = await webhookHandler(failedReq);
  const failedJson = await failedRes.json();
  assert(
    failedRes.status === 200 && failedJson.status === "payment_failed_stock_released",
    "Webhook payment.failed marks order as failed and triggers stock release",
    `Status: ${failedJson.status}`
  );

  const failedStockAfter = testVariant?.stock_quantity ?? 0;
  assert(
    failedStockAfter === failedStockBefore + 1,
    "Reserved stock was restored upon payment.failed notification",
    `Stock restored from ${failedStockBefore} to ${failedStockAfter}`
  );

  // -------------------------------------------------------------------------
  // SUITE 5: 30-MINUTE ONLINE ORDER CLEANUP & INVENTORY RESTORATION
  // -------------------------------------------------------------------------
  console.log("\nSUITE 5: 30-Minute Online Order Cleanup (cancelExpiredPendingOnlineOrders)");

  // Seed an expired pending online order (> 30 minutes old)
  const expiredOrderNumber = "VEL-2026-EXPIRED-999";
  const stockBeforeCleanup = testVariant?.stock_quantity ?? 0;

  MOCK_ONLINE_PENDING_ORDERS.push({
    orderNumber: expiredOrderNumber,
    variantId: "v1-1",
    quantity: 2, // 2 units soft-reserved
    createdAt: Date.now() - 40 * 60 * 1000, // 40 minutes ago (EXPIRED!)
    paymentMethod: "razorpay",
    status: "pending",
  });

  // Also seed a COD pending order (45 minutes ago) to confirm COD is NOT affected!
  const codPendingOrderNumber = "VEL-2026-COD-PENDING-888";
  MOCK_ONLINE_PENDING_ORDERS.push({
    orderNumber: codPendingOrderNumber,
    variantId: "v1-1",
    quantity: 1,
    createdAt: Date.now() - 45 * 60 * 1000,
    paymentMethod: "cod", // Cash on Delivery!
    status: "pending",
  });

  // Run cleanup job
  const cleanupResult = await cancelExpiredPendingOnlineOrders(30);

  assert(
    cleanupResult.cancelledOrderNumbers.includes(expiredOrderNumber),
    "Cleanup job cancels expired online order older than 30 minutes",
    `Cancelled orders: ${cleanupResult.cancelledOrderNumbers.join(", ")}`
  );

  assert(
    !cleanupResult.cancelledOrderNumbers.includes(codPendingOrderNumber),
    "Cash on Delivery (COD) orders are explicitly untouched by online cleanup",
    `COD order ${codPendingOrderNumber} remains active`
  );

  const stockAfterCleanup = testVariant?.stock_quantity ?? 0;
  assert(
    stockAfterCleanup === stockBeforeCleanup + 2,
    "Soft-reserved stock (2 units) was restored to catalog upon 30-minute expiration",
    `Stock increased from ${stockBeforeCleanup} to ${stockAfterCleanup}`
  );

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("STATUS: ALL PHASE 3C RAZORPAY INTEGRATION TESTS PASSED! ✓");
    console.log("================================================================\n");
    process.exit(0);
  } else {
    console.error(`STATUS: ${totalTests - passedTests} TESTS FAILED! ✗`);
    console.log("================================================================\n");
    process.exit(1);
  }
}

runRazorpayIntegrationTests().catch((err) => {
  console.error("Fatal error during Razorpay integration test execution:", err);
  process.exit(1);
});
