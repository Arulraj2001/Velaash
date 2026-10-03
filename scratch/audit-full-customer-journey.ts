export {};

try {
  process.loadEnvFile(".env.local");
} catch {}

// Mock server-only for standalone script execution outside Next.js bundler
const Module = require("node:module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path: string) {
  if (path === "server-only") {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

interface TestAuditResult {
  section: string;
  testName: string;
  status: "PASS" | "FAIL" | "OBSERVATION" | "BUG";
  action: string;
  actual: string;
  expected: string;
  details?: any;
}

const auditResults: TestAuditResult[] = [];
const createdTestOrders: string[] = [];
const createdTestUsers: string[] = [];

function record(result: TestAuditResult) {
  auditResults.push(result);
  const icon = result.status === "PASS" ? "✅ [PASS]" : result.status === "BUG" ? "❌ [BUG]" : result.status === "FAIL" ? "🛑 [FAIL]" : "ℹ️ [OBSERVATION]";
  console.log(`${icon} [${result.section}] ${result.testName}`);
  console.log(`   Action:   ${result.action}`);
  console.log(`   Actual:   ${result.actual}`);
  if (result.status !== "PASS") {
    console.log(`   Expected: ${result.expected}`);
  }
}

async function runAudit() {
  console.log("================================================================================");
  console.log("   VELAASH COMPLETE CUSTOMER PURCHASE JOURNEY & FAILURE RESILIENCE AUDIT       ");
  console.log("================================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();
  const { createOrderAction } = await import("../features/checkout/actions/create-order-action");
  const { verifyRazorpayPaymentAction } = await import("../features/checkout/actions/verify-razorpay-payment-action");
  const { validateCouponAction } = await import("../features/cart/actions/validate-coupon-action");
  const { cancelExpiredPendingOnlineOrders } = await import("../features/checkout/services/order-cleanup");
  const { verifyRazorpayWebhookSignature } = await import("../lib/razorpay");
  const { POST: razorpayWebhookHandler } = await import("../app/api/webhooks/razorpay/route");
  const { getSiteSettings } = await import("../features/settings/queries/get-site-settings");
  const { getOrderByNumber } = await import("../features/checkout/queries/get-order-by-number");
  const { checkCodRateLimit } = await import("../lib/rate-limit");
  const { DISPATCHED_EMAILS_LOG } = await import("../lib/email/resend");
  const { OrderConfirmationEmail } = await import("../features/checkout/emails/order-confirmation-email");
  const { PaymentFailedEmail } = await import("../features/checkout/emails/payment-failed-email");
  const { AccountWelcomeEmail } = await import("../features/checkout/emails/account-welcome-email");
  const { render } = await import("@react-email/render");
  const crypto = await import("node:crypto");
  const React = await import("react");

  const siteSettings = await getSiteSettings();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  // Pick a real active product and variant for testing
  const { data: testProducts } = await admin
    .from("products")
    .select(`
      id, name, base_price,
      product_variants ( id, size, color, stock_quantity, is_active )
    `)
    .eq("is_active", true)
    .gt("product_variants.stock_quantity", 2)
    .limit(2);

  const testProduct = testProducts?.[0];
  const testVariant = testProduct?.product_variants?.[0];

  if (!testProduct || !testVariant) {
    throw new Error("Could not find an active test product with sufficient stock in database.");
  }

  console.log(`Audit Target Product: "${testProduct.name}" (ID: ${testProduct.id})`);
  console.log(`Audit Target Variant: Size: ${testVariant.size}, Color: ${testVariant.color} (ID: ${testVariant.id}, Stock: ${testVariant.stock_quantity})\n`);

  // ============================================================================
  // 1. HAPPY PATH A: CASH ON DELIVERY (COD) JOURNEY
  // ============================================================================
  console.log("--- SECTION 1: Cash on Delivery (COD) Happy Path Journey ---");
  const codInitialStock = testVariant.stock_quantity;
  const codIdempotencyKey = `audit-cod-${Date.now()}`;
  const codCustomerEmail = `audit.cod.${Date.now()}@example.com`;

  const codPayload = {
    contact: {
      email: codCustomerEmail,
      phone: "9876543210",
      createAccount: false,
    },
    shippingAddress: {
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "Villa 42, Palm Meadows",
      addressLine2: "Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      addressType: "home" as const,
      saveAddress: false,
    },
    paymentMethod: "cod" as const,
    items: [
      {
        productId: testProduct.id,
        variantId: testVariant.id,
        quantity: 1,
      },
    ],
    couponCode: null,
    idempotencyKey: codIdempotencyKey,
  };

  const codResult = await createOrderAction(codPayload);

  if (codResult.success && codResult.orderNumber) {
    createdTestOrders.push(codResult.orderNumber);

    // Verify order in DB
    const { data: dbOrder } = await admin
      .from("orders")
      .select("*, order_items(*), order_status_history(*)")
      .eq("order_number", codResult.orderNumber)
      .single();

    record({
      section: "Happy Path: COD",
      testName: "Order creation and persistence",
      status: dbOrder && dbOrder.status === "pending" && dbOrder.payment_status === "pending" ? "PASS" : "FAIL",
      action: "Submitted checkout for 1 item with COD payment method",
      actual: `Created order ${codResult.orderNumber} with status "${dbOrder?.status}", payment_status "${dbOrder?.payment_status}", total ₹${dbOrder?.total_amount}`,
      expected: "Order created with status 'pending', payment_status 'pending', matching line items",
    });

    // Verify stock deduction
    const { data: updatedVariant } = await admin
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", testVariant.id)
      .single();

    const stockDeductedCorrectly = updatedVariant?.stock_quantity === codInitialStock - 1;
    record({
      section: "Happy Path: COD",
      testName: "Inventory stock deduction",
      status: stockDeductedCorrectly ? "PASS" : "FAIL",
      action: `Checked stock quantity for variant ${testVariant.id}`,
      actual: `Initial stock: ${codInitialStock}, New stock: ${updatedVariant?.stock_quantity} (decremented by 1)`,
      expected: `Stock decremented by ordered quantity to ${codInitialStock - 1}`,
    });

    // Verify email dispatch for COD
    const codEmailDispatched = DISPATCHED_EMAILS_LOG.find(
      (e) => e.orderNumber === codResult.orderNumber && e.to === codCustomerEmail
    );
    record({
      section: "Happy Path: COD",
      testName: "Order confirmation email dispatch",
      status: codEmailDispatched ? "PASS" : "FAIL",
      action: "Inspected transactional email dispatch log for COD order",
      actual: codEmailDispatched ? `Email logged with subject "${codEmailDispatched.subject}"` : "No confirmation email found in dispatch log",
      expected: `Confirmation email dispatched to ${codCustomerEmail}`,
    });
  } else {
    record({
      section: "Happy Path: COD",
      testName: "Order creation and persistence",
      status: "FAIL",
      action: "Submitted COD checkout",
      actual: `Order submission failed: ${(codResult as any).error}`,
      expected: "Order created successfully",
    });
  }

  // ============================================================================
  // 2. HAPPY PATH B: RAZORPAY TEST PAYMENT JOURNEY
  // ============================================================================
  console.log("\n--- SECTION 2: Razorpay (Real Test API Keys) Payment Journey ---");
  const rzpInitialStock = (await admin.from("product_variants").select("stock_quantity").eq("id", testVariant.id).single()).data?.stock_quantity || 0;
  const rzpIdempotencyKey = `audit-rzp-${Date.now()}`;
  const rzpCustomerEmail = `audit.rzp.${Date.now()}@example.com`;

  const rzpPayload = {
    contact: {
      email: rzpCustomerEmail,
      phone: "9876543210",
      createAccount: false,
    },
    shippingAddress: {
      fullName: "Ananya Roy",
      phone: "9876543210",
      addressLine1: "Flat 12B, Regency Heights",
      addressLine2: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      addressType: "home" as const,
      saveAddress: false,
    },
    paymentMethod: "razorpay" as const,
    items: [
      {
        productId: testProduct.id,
        variantId: testVariant.id,
        quantity: 1,
      },
    ],
    couponCode: null,
    idempotencyKey: rzpIdempotencyKey,
  };

  const rzpResult = await createOrderAction(rzpPayload);

  if (rzpResult.success && rzpResult.orderNumber && rzpResult.razorpayOrderId) {
    createdTestOrders.push(rzpResult.orderNumber);

    const isRealRzpOrder = rzpResult.razorpayOrderId.startsWith("order_") && !rzpResult.razorpayOrderId.includes("mock");
    record({
      section: "Happy Path: Razorpay",
      testName: "Razorpay order creation with real test keys",
      status: isRealRzpOrder ? "PASS" : "FAIL",
      action: "Created online payment order via createOrderAction",
      actual: `Created Velaash order ${rzpResult.orderNumber} with real Razorpay Order ID "${rzpResult.razorpayOrderId}" (${rzpResult.amountPaise} paise)`,
      expected: "Real Razorpay Order ID created via https://api.razorpay.com/v1/orders starting with 'order_'",
    });

    // Verify cryptographic signature payment verification
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const simulatedPaymentId = `pay_test_${Date.now()}`;
    const signaturePayload = `${rzpResult.razorpayOrderId}|${simulatedPaymentId}`;
    const validSignature = crypto.createHmac("sha256", secret).update(signaturePayload).digest("hex");

    // Test verifyRazorpayPaymentAction behavior with simulated payment ID
    // (Note: Server-side code strictly calls fetchRazorpayPayment to verify the payment actually exists on Razorpay)
    const verifyResult = await verifyRazorpayPaymentAction({
      orderNumber: rzpResult.orderNumber,
      razorpayOrderId: rzpResult.razorpayOrderId,
      razorpayPaymentId: simulatedPaymentId,
      razorpaySignature: validSignature,
    });

    const isSecurityGuardTriggered = verifyResult.success === false && verifyResult.code === "PAYMENT_PENDING_WEBHOOK";
    record({
      section: "Happy Path: Razorpay",
      testName: "Server-side Razorpay payment lookup guard returns PAYMENT_PENDING_WEBHOOK when unindexed",
      status: isSecurityGuardTriggered ? "PASS" : "FAIL",
      action: "Called verifyRazorpayPaymentAction with valid HMAC signature before Razorpay index completion",
      actual: `Success: ${verifyResult.success}, code: "${(verifyResult as any).code}", error: "${(verifyResult as any).error}"`,
      expected: "Returns code 'PAYMENT_PENDING_WEBHOOK' with friendly bank confirmation copy",
    });

    // Verify stock reservation during checkout creation
    const { data: rzpUpdatedVariant } = await admin
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", testVariant.id)
      .single();

    record({
      section: "Happy Path: Razorpay",
      testName: "Inventory stock reservation for online order",
      status: rzpUpdatedVariant?.stock_quantity === rzpInitialStock - 1 ? "PASS" : "FAIL",
      action: "Checked stock quantity after online order creation",
      actual: `Stock before online order: ${rzpInitialStock}, New stock: ${rzpUpdatedVariant?.stock_quantity}`,
      expected: `Stock decremented by 1 to ${rzpInitialStock - 1}`,
    });

    // Authoritative Webhook: Deliver payment.captured event
    const webhookBody = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: simulatedPaymentId,
            order_id: rzpResult.razorpayOrderId,
            amount: rzpResult.amountPaise,
            currency: "INR",
            status: "captured",
            notes: { order_number: rzpResult.orderNumber },
          },
        },
      },
    });

    const webhookSig = crypto.createHmac("sha256", webhookSecret).update(webhookBody).digest("hex");
    const webhookReq1 = new Request("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": webhookSig, "content-type": "application/json" },
      body: webhookBody,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webhookRes1 = await razorpayWebhookHandler(webhookReq1 as any);
    const webhookData1 = await webhookRes1.json();

    // Check DB state after webhook confirmation
    const { data: paidDbOrder } = await admin
      .from("orders")
      .select("status, payment_status, razorpay_payment_id")
      .eq("order_number", rzpResult.orderNumber)
      .single();

    record({
      section: "Happy Path: Razorpay",
      testName: "Authoritative webhook payment.captured confirms order & records payment",
      status: paidDbOrder?.status === "confirmed" && paidDbOrder?.payment_status === "paid" ? "PASS" : "FAIL",
      action: "Processed signed payment.captured webhook notification",
      actual: `Webhook status: "${webhookData1.status}", DB order status: "${paidDbOrder?.status}", payment_status: "${paidDbOrder?.payment_status}", payment_id: "${paidDbOrder?.razorpay_payment_id}"`,
      expected: "Order status transitioned to 'confirmed', payment_status 'paid', payment ID recorded",
    });

    // Deliver duplicate webhook to verify idempotency
    const webhookReq2 = new Request("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": webhookSig, "content-type": "application/json" },
      body: webhookBody,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webhookRes2 = await razorpayWebhookHandler(webhookReq2 as any);
    const webhookData2 = await webhookRes2.json();

    record({
      section: "Happy Path: Razorpay",
      testName: "Webhook payment.captured idempotency on duplicate delivery",
      status: webhookData2.received === true && webhookData2.status === "duplicate_skipped" ? "PASS" : "FAIL",
      action: "Delivered duplicate payment.captured webhook event for already-confirmed order",
      actual: `HTTP ${webhookRes2.status}, returned: ${JSON.stringify(webhookData2)}`,
      expected: "HTTP 200, status 'duplicate_skipped' (graceful idempotent handling)",
    });
  } else {
    record({
      section: "Happy Path: Razorpay",
      testName: "Razorpay order creation with real test keys",
      status: "FAIL",
      action: "Online order creation",
      actual: `Failed: ${(rzpResult as any).error}`,
      expected: "Successful creation",
    });
  }

  // ============================================================================
  // 3. FAILURE SCENARIO 1: OUT OF STOCK & CONCURRENCY RACE CONDITIONS
  // ============================================================================
  console.log("\n--- SECTION 3: Inventory & Concurrency Failure Scenarios ---");
  // 3A. Request higher quantity than available
  const currentVariantStock = (await admin.from("product_variants").select("stock_quantity").eq("id", testVariant.id).single()).data?.stock_quantity || 0;
  const excessiveQuantity = currentVariantStock + 10;

  const excessPayload = {
    ...codPayload,
    idempotencyKey: `audit-excess-${Date.now()}`,
    items: [{ productId: testProduct.id, variantId: testVariant.id, quantity: excessiveQuantity }],
  };

  const excessResult = await createOrderAction(excessPayload);
  record({
    section: "Failure Scenarios: Stock",
    testName: "Attempt to order quantity exceeding stock",
    status: excessResult.success === false && excessResult.code === "OUT_OF_STOCK" ? "PASS" : "FAIL",
    action: `Attempted to order quantity ${excessiveQuantity} when available stock is ${currentVariantStock}`,
    actual: `Blocked with error: "${(excessResult as any).error}" (Code: ${(excessResult as any).code})`,
    expected: "Rejected with code 'OUT_OF_STOCK' and exact available stock count in message",
  });

  // 3B. Race condition: 2 concurrent checkouts competing for the LAST remaining unit
  // Temporarily set a designated test variant to 1 stock unit
  const raceVariantId = "d1111111-1111-4111-d111-000000000004"; // Chanderi L Kora Ivory
  const { data: initialRaceVar } = await admin.from("product_variants").select("stock_quantity").eq("id", raceVariantId).single();
  const savedRaceStock = initialRaceVar?.stock_quantity ?? 2;

  // Set stock to exactly 1
  await admin.from("product_variants").update({ stock_quantity: 1 }).eq("id", raceVariantId);

  const raceOrder1Payload = {
    ...codPayload,
    contact: { ...codPayload.contact, phone: "9876543211", email: `audit.race1.${Date.now()}@example.com` },
    idempotencyKey: `audit-race-1-${Date.now()}`,
    items: [{ productId: testProduct.id, variantId: raceVariantId, quantity: 1 }],
  };

  const raceOrder2Payload = {
    ...codPayload,
    contact: { ...codPayload.contact, phone: "9876543212", email: `audit.race2.${Date.now()}@example.com` },
    idempotencyKey: `audit-race-2-${Date.now()}`,
    items: [{ productId: testProduct.id, variantId: raceVariantId, quantity: 1 }],
  };

  // Launch both requests simultaneously
  const [raceRes1, raceRes2] = await Promise.all([
    createOrderAction(raceOrder1Payload),
    createOrderAction(raceOrder2Payload),
  ]);

  if (raceRes1.success && raceRes1.orderNumber) createdTestOrders.push(raceRes1.orderNumber);
  if (raceRes2.success && raceRes2.orderNumber) createdTestOrders.push(raceRes2.orderNumber);

  const { data: finalRaceVar } = await admin.from("product_variants").select("stock_quantity").eq("id", raceVariantId).single();

  const exactlyOneSucceeded = (raceRes1.success && !raceRes2.success) || (!raceRes1.success && raceRes2.success);
  const failedRes: any = !raceRes1.success ? raceRes1 : raceRes2;
  const isOutOfStockRejection = failedRes.code === "OUT_OF_STOCK" || failedRes.error?.includes("stock") || failedRes.error?.includes("available");
  const noOverselling = finalRaceVar?.stock_quantity === 0;

  record({
    section: "Failure Scenarios: Stock",
    testName: "Two concurrent orders competing for last unit (No overselling race condition)",
    status: exactlyOneSucceeded && noOverselling ? "PASS" : "FAIL",
    action: "Fired 2 parallel checkout requests concurrently against a variant with exactly 1 unit left",
    actual: `Order 1 success: ${raceRes1.success}, Order 2 success: ${raceRes2.success}, Rejection: "${failedRes.error}" (Code: ${failedRes.code}), Final remaining stock: ${finalRaceVar?.stock_quantity}`,
    expected: "Exactly one order succeeds, the other is rejected with 'OUT_OF_STOCK', stock drops to 0 (never negative)",
  });

  // Restore stock
  await admin.from("product_variants").update({ stock_quantity: savedRaceStock }).eq("id", raceVariantId);

  // ============================================================================
  // 4. FAILURE SCENARIO 2: RAZORPAY FAILURES & RECOVERY
  // ============================================================================
  console.log("\n--- SECTION 4: Razorpay Failures & Edge Cases ---");
  // 4A. Modal closed mid-payment / customer retry on same pending order
  const retryEmail = `audit.retry.${Date.now()}@example.com`;
  const retryIdempotency = `audit-retry-${Date.now()}`;
  const retryPayload = {
    ...rzpPayload,
    contact: { email: retryEmail, phone: "9876543210", createAccount: false },
    idempotencyKey: retryIdempotency,
  };

  const initialPendingOrder = await createOrderAction(retryPayload);
  if (initialPendingOrder.success && initialPendingOrder.orderNumber) {
    createdTestOrders.push(initialPendingOrder.orderNumber);

    // Customer re-submits with the same idempotency key (simulating retry on same pending order)
    const retriedOrder = await createOrderAction(retryPayload);

    const reusesSameOrder =
      retriedOrder.success &&
      retriedOrder.isDuplicate === true &&
      retriedOrder.orderNumber === initialPendingOrder.orderNumber &&
      retriedOrder.razorpayOrderId === initialPendingOrder.razorpayOrderId;

    record({
      section: "Failure Scenarios: Razorpay",
      testName: "Customer closes modal & retries payment (Reuses existing order, no duplicate)",
      status: reusesSameOrder ? "PASS" : "FAIL",
      action: "Submitted checkout, simulated modal dismissal, then re-submitted same checkout payload",
      actual: `First order: ${initialPendingOrder.orderNumber}, Retry order: ${(retriedOrder as any).orderNumber}, isDuplicate flag: ${(retriedOrder as any).isDuplicate}`,
      expected: "Returns the identical order number and Razorpay order ID without creating a new order row",
    });

    // 4B. Simulated payment.failed webhook
    const failedPaymentId = `pay_failed_sim_${Date.now()}`;
    const failWebhookBody = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: failedPaymentId,
            order_id: initialPendingOrder.razorpayOrderId,
            amount: initialPendingOrder.amountPaise,
            currency: "INR",
            status: "failed",
            error_description: "Card declined by issuing bank (insufficient funds)",
            email: retryEmail,
            notes: { order_number: initialPendingOrder.orderNumber, email: retryEmail },
          },
        },
      },
    });

    const failWebhookSig = crypto.createHmac("sha256", webhookSecret).update(failWebhookBody).digest("hex");
    const failWebhookReq = new Request("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": failWebhookSig,
        "content-type": "application/json",
      },
      body: failWebhookBody,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failWebhookRes = await razorpayWebhookHandler(failWebhookReq as any);
    const failWebhookData = await failWebhookRes.json();

    // Verify order remains recoverable pending
    const { data: failedOrderState } = await admin
      .from("orders")
      .select("status, payment_status, order_status_history(*)")
      .eq("order_number", initialPendingOrder.orderNumber)
      .single();

    const orderStillPending = failedOrderState?.status === "pending" && failedOrderState?.payment_status === "pending";
    const historyLoggedFailure = failedOrderState?.order_status_history?.some((h: any) =>
      h.note?.includes("Payment attempt failed")
    );

    record({
      section: "Failure Scenarios: Razorpay",
      testName: "payment.failed webhook maintains order in recoverable 'pending' state",
      status: orderStillPending && historyLoggedFailure ? "PASS" : "FAIL",
      action: "Dispatched payment.failed webhook to /api/webhooks/razorpay",
      actual: `Order status: "${failedOrderState?.status}", payment_status: "${failedOrderState?.payment_status}", history logs: ${failedOrderState?.order_status_history?.length}`,
      expected: "Order remains 'pending' (recoverable), failure reason logged in order_status_history",
    });

    // Verify Payment Failed email was dispatched
    const failedEmailDispatched = DISPATCHED_EMAILS_LOG.find(
      (e) => e.orderNumber === initialPendingOrder.orderNumber && e.subject.includes("Payment Notice")
    );

    record({
      section: "Failure Scenarios: Razorpay",
      testName: "Payment Failed email dispatched with retry URL",
      status: failedEmailDispatched ? "PASS" : "FAIL",
      action: "Checked transactional email log for Payment Failed notification",
      actual: failedEmailDispatched
        ? `Dispatched with subject "${failedEmailDispatched.subject}" to "${failedEmailDispatched.to}"`
        : "No payment failed email recorded in dispatch log",
      expected: "Payment Failed email dispatched with clear reference and retry link",
    });
  }

  // ============================================================================
  // 5. FAILURE SCENARIO 3: COUPON VALIDATION & DISCREPANCY AUDIT
  // ============================================================================
  console.log("\n--- SECTION 5: Coupon Validation & Configuration Audit ---");
  // 5A. Non-existent coupon
  const invalidCouponRes = await validateCouponAction("NONEXISTENT_PROMO", 5000);
  record({
    section: "Failure Scenarios: Coupons",
    testName: "Invalid / non-existent coupon code rejection",
    status: invalidCouponRes.success === false ? "PASS" : "FAIL",
    action: "Validated non-existent coupon code 'NONEXISTENT_PROMO'",
    actual: `Rejected with message: "${(invalidCouponRes as any).error}"`,
    expected: "Rejected with clear invalid coupon message",
  });

  // 5B. Real WELCOME400 Coupon Value Verification
  const welcome400Res = await validateCouponAction("WELCOME400", 4250);
  const welcome400Discount = welcome400Res.success ? welcome400Res.discountAmount : 0;
  const isExpected400 = welcome400Discount === 400;

  record({
    section: "Failure Scenarios: Coupons",
    testName: "WELCOME400 coupon discount amount verification",
    status: isExpected400 ? "PASS" : "BUG",
    action: "Applied WELCOME400 coupon to ₹4,250 order subtotal",
    actual: `Discount applied: ₹${welcome400Discount} (Coupon record has discountValue: ${welcome400Res.success ? welcome400Res.coupon.discountValue : 'N/A'}, announcement bar advertises: "₹400 Off")`,
    expected: "Discount applied should be ₹400 to match the advertised promotional copy",
  });

  // ============================================================================
  // 6. FAILURE SCENARIO 4: ADDRESS & CONTACT VALIDATION FAILURES
  // ============================================================================
  console.log("\n--- SECTION 6: Address & Contact Validation Failures ---");
  // 6A. Invalid Pincode (e.g. 000000 or 5 digits)
  const invalidPincodePayload = {
    ...codPayload,
    idempotencyKey: `audit-pin-${Date.now()}`,
    shippingAddress: {
      ...codPayload.shippingAddress,
      pincode: "000000", // Invalid first digit (must be 1-9)
    },
  };

  const badPinRes = await createOrderAction(invalidPincodePayload);
  record({
    section: "Failure Scenarios: Validation",
    testName: "Invalid pincode format rejection ('000000')",
    status: badPinRes.success === false && badPinRes.code === "INVALID_INPUT" ? "PASS" : "FAIL",
    action: "Submitted checkout with invalid Indian pincode '000000'",
    actual: `Blocked with error: "${(badPinRes as any).error}" (Code: ${(badPinRes as any).code})`,
    expected: "Blocked with code 'INVALID_INPUT' (6-digit Indian PIN starting with 1-9 required)",
  });

  // 6B. Invalid Phone format (e.g. 5 digits)
  const invalidPhonePayload = {
    ...codPayload,
    idempotencyKey: `audit-phone-${Date.now()}`,
    contact: {
      ...codPayload.contact,
      phone: "12345", // Too short
    },
  };

  const badPhoneRes = await createOrderAction(invalidPhonePayload);
  record({
    section: "Failure Scenarios: Validation",
    testName: "Invalid phone number format rejection ('12345')",
    status: badPhoneRes.success === false && badPhoneRes.code === "INVALID_INPUT" ? "PASS" : "FAIL",
    action: "Submitted checkout with 5-digit phone number '12345'",
    actual: `Blocked with error: "${(badPhoneRes as any).error}" (Code: ${(badPhoneRes as any).code})`,
    expected: "Blocked with code 'INVALID_INPUT' (Valid 10-digit Indian mobile required)",
  });

  // ============================================================================
  // 7. FAILURE SCENARIO 5: COD-SPECIFIC FAILURES
  // ============================================================================
  console.log("\n--- SECTION 7: Cash on Delivery Constraints & Rate Limiting ---");
  // 7A. Exceed cod_max_order_value
  const codMax = siteSettings.paymentSettings.cod_max_order_value || 10000;
  const highValueItemQuantity = Math.ceil((codMax + 2000) / testProduct.base_price); // 6 units @ ₹4250 = ₹25,500 > ₹20,000

  // Temporarily grant sufficient stock to test variant so stock check passes and COD limit is triggered
  const codVariantId = "d1111111-1111-4111-d111-000000000006";
  const { data: initialCodVar } = await admin.from("product_variants").select("stock_quantity").eq("id", codVariantId).single();
  const savedCodStock = initialCodVar?.stock_quantity ?? 2;
  await admin.from("product_variants").update({ stock_quantity: 10 }).eq("id", codVariantId);

  const overCodMaxPayload = {
    ...codPayload,
    idempotencyKey: `audit-codmax-${Date.now()}`,
    items: [{ productId: testProduct.id, variantId: codVariantId, quantity: highValueItemQuantity }],
  };

  const overCodRes = await createOrderAction(overCodMaxPayload);
  await admin.from("product_variants").update({ stock_quantity: savedCodStock }).eq("id", codVariantId);

  const isCodBlocked = overCodRes.success === false && overCodRes.code === "COD_UNAVAILABLE";

  record({
    section: "Failure Scenarios: COD",
    testName: "COD maximum order value (₹20,000 limit) enforcement",
    status: isCodBlocked ? "PASS" : "FAIL",
    action: `Submitted COD order totaling ₹${(highValueItemQuantity * testProduct.base_price).toLocaleString("en-IN")} exceeding COD limit ₹${codMax.toLocaleString("en-IN")}`,
    actual: `Blocked with error: "${(overCodRes as any).error}" (Code: ${(overCodRes as any).code})`,
    expected: `Blocked with code 'COD_UNAVAILABLE' and clear message stating maximum limit ₹${codMax.toLocaleString("en-IN")}`,
  });

  // 7B. COD Rate Limiter
  const testSpamPhone = "9999900001";
  const testIp = "192.168.1.100";
  // Simulate 3 allowed calls
  const r1 = await checkCodRateLimit({ phone: testSpamPhone, ip: testIp });
  const r2 = await checkCodRateLimit({ phone: testSpamPhone, ip: testIp });
  const r3 = await checkCodRateLimit({ phone: testSpamPhone, ip: testIp });
  const r4 = await checkCodRateLimit({ phone: testSpamPhone, ip: testIp }); // 4th attempt should be BLOCKED

  record({
    section: "Failure Scenarios: COD",
    testName: "COD rate limiting blocks rapid repeated submissions (>3 orders/24h)",
    status: r1.allowed && r2.allowed && r3.allowed && !r4.allowed ? "PASS" : "FAIL",
    action: "Attempted 4 rapid COD checks with phone '9999900001'",
    actual: `Attempt 1: ${r1.allowed}, Attempt 2: ${r2.allowed}, Attempt 3: ${r3.allowed}, Attempt 4 (Exceeded): allowed=${r4.allowed}, error="${r4.errorMessage}"`,
    expected: "First 3 attempts allowed; 4th attempt blocked with rate limit error message",
  });

  // ============================================================================
  // 8. FAILURE SCENARIO 6: SESSION / TIMING EDGE CASES (REAPER CLEANUP)
  // ============================================================================
  console.log("\n--- SECTION 8: Session Expiry & Inventory Reaper Cleanup ---");
  // Create an abandoned online order using variant with guaranteed stock
  const reaperVariantId = "d1111111-1111-4111-d111-000000000007";
  const { data: initReaperVar } = await admin.from("product_variants").select("stock_quantity").eq("id", reaperVariantId).single();
  const savedReaperStock = initReaperVar?.stock_quantity ?? 2;
  await admin.from("product_variants").update({ stock_quantity: 2 }).eq("id", reaperVariantId);

  const reaperStockBefore = 2;
  const reaperPayload = {
    ...rzpPayload,
    items: [{ productId: testProduct.id, variantId: reaperVariantId, quantity: 1 }],
    idempotencyKey: `audit-reaper-${Date.now()}`,
    contact: { email: `audit.reaper.${Date.now()}@example.com`, phone: "9876543210", createAccount: false },
  };

  const reaperOrder = await createOrderAction(reaperPayload);
  if (reaperOrder.success && reaperOrder.orderNumber) {
    createdTestOrders.push(reaperOrder.orderNumber);

    // Stock should be decremented by 1 (from 2 to 1)
    const { data: stockAfterReservation } = await admin.from("product_variants").select("stock_quantity").eq("id", reaperVariantId).single();

    // Artificially age the order's created_at by 45 minutes to simulate expiration
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    await admin
      .from("orders")
      .update({ created_at: fortyFiveMinutesAgo })
      .eq("order_number", reaperOrder.orderNumber);

    // Run reaper cleanup job
    const cleanupResult = await cancelExpiredPendingOnlineOrders(30);

    // Verify order is now cancelled
    const { data: cleanedDbOrder } = await admin
      .from("orders")
      .select("status, payment_status")
      .eq("order_number", reaperOrder.orderNumber)
      .single();

    // Verify stock is restored
    const { data: stockAfterReaper } = await admin.from("product_variants").select("stock_quantity").eq("id", reaperVariantId).single();

    const orderCancelled = cleanedDbOrder?.status === "cancelled";
    const stockRestored = stockAfterReaper?.stock_quantity === reaperStockBefore;

    record({
      section: "Failure Scenarios: Reaper",
      testName: "Abandoned online pending order expires after 30 mins and releases stock",
      status: orderCancelled && stockRestored ? "PASS" : "FAIL",
      action: "Created online pending order, aged timestamp to 45m ago, invoked cancelExpiredPendingOnlineOrders(30)",
      actual: `Order status: "${cleanedDbOrder?.status}", Stock before reservation: ${reaperStockBefore}, during reservation: ${stockAfterReservation?.stock_quantity}, after reaper: ${stockAfterReaper?.stock_quantity}`,
      expected: "Order status transitioned to 'cancelled', soft-reserved stock restored to catalog",
    });
  } else {
    record({
      section: "Failure Scenarios: Reaper",
      testName: "Abandoned online pending order expires after 30 mins and releases stock",
      status: "FAIL",
      action: "Create online pending order for reaper test",
      actual: `Failed to create initial pending order: ${(reaperOrder as any).error}`,
      expected: "Order created successfully",
    });
  }
  // Restore initial stock
  await admin.from("product_variants").update({ stock_quantity: savedReaperStock }).eq("id", reaperVariantId);

  // ============================================================================
  // 9. EMAIL CONTENT & TEMPLATE INTEGRITY AUDIT
  // ============================================================================
  console.log("\n--- SECTION 9: Email Template Rendering & Resend Audit ---");
  // 9A. Render OrderConfirmationEmail
  try {
    const confirmationHtml = await render(
      React.createElement(OrderConfirmationEmail, {
        orderNumber: "VEL-2026-TEST",
        customerName: "Priya Sharma",
        orderDate: "October 2, 2026",
        paymentMethod: "cod",
        paymentStatus: "pending",
        items: [
          {
            title: "Chanderi Embroidered Kurta Set",
            size: "M",
            color: "Kora Ivory",
            quantity: 1,
            unitPrice: 4250,
            lineSubtotal: 4250,
          },
        ],
        subtotal: 4250,
        discountAmount: 0,
        shippingCharge: 0,
        totalAmount: 4250,
        shippingAddress: {
          fullName: "Priya Sharma",
          phone: "9876543210",
          addressLine1: "123 MG Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        supportEmail: siteSettings.storeProfile.email,
        orderViewUrl: "https://velaash.in/order-confirmation/VEL-2026-TEST",
      })
    );

    const hasBrokenTags = confirmationHtml.includes("undefined") || confirmationHtml.includes("NaN") || confirmationHtml.includes("[object Object]");
    const hasOrderNumber = confirmationHtml.includes("VEL-2026-TEST");
    const hasBrandPalette = confirmationHtml.includes("#4D2A00") || confirmationHtml.includes("#CC6F00") || confirmationHtml.includes("#FFFBF0");

    record({
      section: "Email Integrity",
      testName: "OrderConfirmationEmail template renders without broken variables or missing styles",
      status: !hasBrokenTags && hasOrderNumber && hasBrandPalette ? "PASS" : "FAIL",
      action: "Rendered OrderConfirmationEmail component to full HTML string",
      actual: `Rendered ${confirmationHtml.length} bytes, broken placeholders: ${hasBrokenTags ? 'DETECTED' : 'None'}, brand colors present: ${hasBrandPalette}`,
      expected: "Zero undefined/NaN/broken placeholders, valid luxury brand styling",
    });
  } catch (err: any) {
    record({
      section: "Email Integrity",
      testName: "OrderConfirmationEmail template renders without broken variables or missing styles",
      status: "FAIL",
      action: "Render OrderConfirmationEmail",
      actual: `Error: ${err?.message}`,
      expected: "Clean render",
    });
  }

  // 9B. Render PaymentFailedEmail
  try {
    const failedHtml = await render(
      React.createElement(PaymentFailedEmail, {
        orderNumber: "VEL-2026-TEST",
        customerName: "Ananya Roy",
        totalAmount: 4800,
        failureReason: "Card declined by issuing bank",
        retryPaymentUrl: "https://velaash.in/checkout?retry=VEL-2026-TEST",
        supportEmail: siteSettings.storeProfile.email,
      })
    );

    const hasBrokenTags = failedHtml.includes("undefined") || failedHtml.includes("NaN");
    const hasRetryLink = failedHtml.includes("https://velaash.in/checkout?retry=VEL-2026-TEST");

    record({
      section: "Email Integrity",
      testName: "PaymentFailedEmail template renders with working retry link and support contact",
      status: !hasBrokenTags && hasRetryLink ? "PASS" : "FAIL",
      action: "Rendered PaymentFailedEmail component to full HTML string",
      actual: `Rendered ${failedHtml.length} bytes, contains retry URL: ${hasRetryLink}, broken tags: ${hasBrokenTags ? 'DETECTED' : 'None'}`,
      expected: "Contains valid retry link, accurate order number, and store contact",
    });
  } catch (err: any) {
    record({
      section: "Email Integrity",
      testName: "PaymentFailedEmail template render",
      status: "FAIL",
      action: "Render PaymentFailedEmail",
      actual: `Error: ${err?.message}`,
      expected: "Clean render",
    });
  }

  // ============================================================================
  // 10. ORDER CONFIRMATION PAGE & PII SECURITY AUDIT
  // ============================================================================
  console.log("\n--- SECTION 10: Order Confirmation Page & Token Security ---");
  try {
    const codOrderNum = (codResult as any).orderNumber;
    const codToken = (codResult as any).accessToken;
    const codConfirmation = await getOrderByNumber(codOrderNum, { accessToken: codToken });
    const isCodMatching =
      codConfirmation !== null &&
      codConfirmation.orderNumber === codOrderNum &&
      codConfirmation.paymentMethod === "cod" &&
      codConfirmation.totalAmount === (codResult as any).totalAmount &&
      codConfirmation.accessLevel === "FULL";

    record({
      section: "Order Confirmation View",
      testName: "Order confirmation page resolves full details with valid access token (COD)",
      status: isCodMatching ? "PASS" : "FAIL",
      action: `Retrieved order ${codOrderNum} with valid access token`,
      actual: `Found: ${Boolean(codConfirmation)}, accessLevel: "${codConfirmation?.accessLevel}", items: ${codConfirmation?.items?.length}, total: ₹${codConfirmation?.totalAmount}`,
      expected: "Returns full order detail with accessLevel 'FULL' matching order creation",
    });

    const rzpOrderNum = (rzpResult as any).orderNumber;
    const rzpToken = (rzpResult as any).accessToken;
    const rzpConfirmation = await getOrderByNumber(rzpOrderNum, { accessToken: rzpToken });
    const isRzpMatching =
      rzpConfirmation !== null &&
      rzpConfirmation.orderNumber === rzpOrderNum &&
      rzpConfirmation.paymentMethod === "razorpay" &&
      rzpConfirmation.paymentStatus === "paid" &&
      rzpConfirmation.accessLevel === "FULL";

    record({
      section: "Order Confirmation View",
      testName: "Order confirmation page resolves full details & paid status (Razorpay)",
      status: isRzpMatching ? "PASS" : "FAIL",
      action: `Retrieved order ${rzpOrderNum} with valid access token after webhook capture`,
      actual: `Found: ${Boolean(rzpConfirmation)}, paymentStatus: "${rzpConfirmation?.paymentStatus}", accessLevel: "${rzpConfirmation?.accessLevel}"`,
      expected: "Returns full order detail with paymentStatus 'paid' and accessLevel 'FULL'",
    });

    // PII Masking test: Request order WITHOUT token
    const unauthenticatedView = await getOrderByNumber(codOrderNum);
    const isMasked =
      unauthenticatedView !== null &&
      unauthenticatedView.accessLevel === "MASKED" &&
      (unauthenticatedView.shippingAddress.phone.includes("••") || unauthenticatedView.shippingAddress.phone.includes("***"));

    record({
      section: "Order Confirmation View",
      testName: "Unauthenticated order lookup masks sensitive customer PII",
      status: isMasked ? "PASS" : "FAIL",
      action: `Retrieved order ${codOrderNum} without access token or session`,
      actual: `accessLevel: "${unauthenticatedView?.accessLevel}", masked phone: "${unauthenticatedView?.shippingAddress?.phone}"`,
      expected: "accessLevel is 'MASKED' and phone/email/street address are masked",
    });
  } catch (err: any) {
    record({
      section: "Order Confirmation View",
      testName: "Order confirmation query",
      status: "FAIL",
      action: "Retrieve order confirmation details",
      actual: `Error: ${err?.message}`,
      expected: "Clean query execution",
    });
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n================================================================================");
  console.log("   AUDIT SUMMARY & TRACKED TEST ARTIFACTS                                       ");
  console.log("================================================================================");
  const passCount = auditResults.filter((r) => r.status === "PASS").length;
  const bugCount = auditResults.filter((r) => r.status === "BUG").length;
  const failCount = auditResults.filter((r) => r.status === "FAIL").length;
  const obsCount = auditResults.filter((r) => r.status === "OBSERVATION").length;

  console.log(`Total Checks: ${auditResults.length}`);
  console.log(`Passed:       ${passCount}`);
  console.log(`Bugs:         ${bugCount}`);
  console.log(`Failures:     ${failCount}`);
  console.log(`Observations: ${obsCount}`);
  console.log("\nCreated Test Orders for Future Cleanup:", createdTestOrders);

  // Write full audit log to file for reference
  const fs = await import("node:fs/promises");
  await fs.writeFile(
    "scratch/customer-journey-audit-report.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { total: auditResults.length, passed: passCount, bugs: bugCount, failures: failCount, observations: obsCount },
        createdTestOrders,
        auditResults,
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("Full report written to scratch/customer-journey-audit-report.json");
}

runAudit().catch(console.error);
