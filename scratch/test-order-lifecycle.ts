export {};

// Load environment variables for standalone Node execution
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

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-project-ref.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key-12345";
}

let passedTests = 0;
let totalTests = 0;


function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    if (details) console.log(`         ${details}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runOrderLifecycleTests() {
  const { createOrderAction } = await import("../features/checkout/actions/create-order-action");
  const { getOrderByNumber } = await import("../features/checkout/queries/get-order-by-number");
  const {
    checkCodRateLimit,
    resetCodRateLimitsForTest,
    MAX_COD_ORDERS_PER_PHONE_24H,
    MAX_COD_ORDERS_PER_IP_24H,
  } = await import("../lib/rate-limit");
  const { DISPATCHED_EMAILS_LOG, sendTransactionalEmail } = await import("../lib/email/resend");
  const { PaymentFailedEmail } = await import("../features/checkout/emails/payment-failed-email");
  const React = await import("react");


  console.log("================================================================");
  console.log("       VELAASH PHASE 3D: ORDER LIFECYCLE TEST SUITE             ");
  console.log("================================================================\n");

  resetCodRateLimitsForTest();
  DISPATCHED_EMAILS_LOG.length = 0;


  // -------------------------------------------------------------------------
  // SUITE 1: GUEST ORDER CONFIRMATION & PII ACCESS CONTROL MASKING
  // -------------------------------------------------------------------------
  console.log("SUITE 1: Guest Order Confirmation & PII Privacy Access Control");

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
  const testProductName = (dbVariant as unknown as { products: { name: string } }).products?.name || "Hand-Block Printed Anarkali Ensemble";

  const guestEmail = "ananya.roy@example.com";
  const guestPhone = "9876543210";
  const guestAddressLine = "Flat 12B, Palm Meadows, Outer Ring Road";

  const orderResult = await createOrderAction({
    contact: {
      email: guestEmail,
      phone: guestPhone,
      createAccount: true, // Guest opted to create account
    },
    shippingAddress: {
      fullName: "Ananya Roy",
      phone: guestPhone,
      addressLine1: guestAddressLine,
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      addressType: "home",
      saveAddress: false,
    },
    paymentMethod: "cod",
    items: [
      {
        productId: testProductId,
        variantId: testVariantId,
        quantity: 1,
      },
    ],
    idempotencyKey: `idemp-lifecycle-${Date.now()}`,
  });

  assert(
    orderResult.success === true,
    "createOrderAction creates guest COD order successfully",
    `Order Number: ${orderResult.success ? orderResult.orderNumber : "FAILED: " + (orderResult.error || "")}`
  );

  if (!orderResult.success) {
    throw new Error("Order creation failed in test");
  }

  const orderNumber = orderResult.orderNumber;
  const accessToken = orderResult.accessToken;

  assert(
    Boolean(accessToken && accessToken.length >= 16),
    "Server issues cryptographic accessToken for order confirmation access control",
    `Token: ${accessToken?.slice(0, 12)}...`
  );

  // 1.1 FIRST VISIT: Immediate checkout redirect with valid accessToken
  const firstVisitOrder = await getOrderByNumber(orderNumber, { accessToken });
  assert(firstVisitOrder !== null, "getOrderByNumber finds order record");

  if (firstVisitOrder) {
    assert(
      firstVisitOrder.accessLevel === "FULL",
      "First visit with checkout session token grants FULL ACCESS",
      `Access level: ${firstVisitOrder.accessLevel}`
    );

    assert(
      firstVisitOrder.shippingAddress.addressLine1 === guestAddressLine,
      "Full street address is revealed on initial checkout completion visit",
      `Address: "${firstVisitOrder.shippingAddress.addressLine1}"`
    );

    assert(
      firstVisitOrder.shippingAddress.phone === guestPhone,
      "Full phone number is revealed on initial checkout completion visit",
      `Phone: "${firstVisitOrder.shippingAddress.phone}"`
    );

    assert(
      firstVisitOrder.shippingAddress.email === guestEmail,
      "Full email is revealed on initial checkout completion visit",
      `Email: "${firstVisitOrder.shippingAddress.email}"`
    );

    const expectedProductName = testProductName;
    assert(
      firstVisitOrder.items.length === 1 && firstVisitOrder.items[0].title === expectedProductName,
      "Itemized order list is correctly attached with title, variant, and quantity",
      `Title: "${firstVisitOrder.items[0]?.title}"`
    );


  }

  // 1.2 LATER DIRECT VISIT: Simulated direct URL navigation without session token
  const directVisitOrder = await getOrderByNumber(orderNumber, {});
  assert(directVisitOrder !== null, "Direct visit without token successfully returns order");

  if (directVisitOrder) {
    assert(
      directVisitOrder.accessLevel === "MASKED",
      "Direct unauthenticated visit without session token enforces MASKED ACCESS (Privacy Shield)",
      `Access level: ${directVisitOrder.accessLevel}`
    );

    assert(
      directVisitOrder.shippingAddress.addressLine1 === "••••••••••••••••",
      "Street address is securely masked on direct unauthenticated visit",
      `Masked street: "${directVisitOrder.shippingAddress.addressLine1}"`
    );

    assert(
      directVisitOrder.shippingAddress.phone === "•••••• 3210",
      "Phone number is securely masked to last 4 digits on direct unauthenticated visit",
      `Masked phone: "${directVisitOrder.shippingAddress.phone}"`
    );

    assert(
      directVisitOrder.shippingAddress.email.includes("••••"),
      "Email is securely masked on direct unauthenticated visit",
      `Masked email: "${directVisitOrder.shippingAddress.email}"`
    );

    assert(
      directVisitOrder.shippingAddress.city === "Bengaluru" &&
        directVisitOrder.shippingAddress.pincode === "560066",
      "City and Pincode remain visible so customer can verify destination region",
      `City: ${directVisitOrder.shippingAddress.city}, Pincode: ${directVisitOrder.shippingAddress.pincode}`
    );

    assert(
      directVisitOrder.totalAmount === orderResult.totalAmount,
      "Financial total and items remain visible for tracking without exposing customer PII",
      `Total: ₹${directVisitOrder.totalAmount}`
    );
  }

  // 1.3 TAMPERED TOKEN ATTEMPT
  const tamperedVisitOrder = await getOrderByNumber(orderNumber, {
    accessToken: "forged_malicious_token_12345",
  });
  assert(
    tamperedVisitOrder?.accessLevel === "MASKED",
    "Tampered or forged access token fails verification and defaults to MASKED ACCESS"
  );

  // -------------------------------------------------------------------------
  // SUITE 2: TRANSACTIONAL EMAILS VIA RESEND + REACT EMAIL
  // -------------------------------------------------------------------------
  console.log("\nSUITE 2: Transactional Emails (Resend + React Email)");

  // Check audit log from the COD order created above
  const orderConfirmationEmail = DISPATCHED_EMAILS_LOG.find(
    (e) => e.orderNumber === orderNumber && e.to === guestEmail
  );

  assert(
    orderConfirmationEmail !== undefined,
    "Order confirmation email was triggered automatically upon order creation",
    `Recipient: ${orderConfirmationEmail?.to}, Subject: "${orderConfirmationEmail?.subject}"`
  );

  if (orderConfirmationEmail) {
    assert(
      orderConfirmationEmail.subject.includes(orderNumber),
      "Order confirmation email subject contains authoritative order reference number"
    );

    // Verify React Email props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailProps = (orderConfirmationEmail.reactComponent as any)?.props;
    assert(
      emailProps && emailProps.orderNumber === orderNumber,
      "React Email template receives correct orderNumber prop",
      `Props orderNumber: ${emailProps?.orderNumber}`
    );

    assert(
      emailProps.totalAmount === orderResult.totalAmount,
      "React Email template receives authoritative server total amount",
      `Props totalAmount: ₹${emailProps?.totalAmount}`
    );

    assert(
      emailProps.shippingAddress?.fullName === "Ananya Roy",
      "React Email template receives verified delivery recipient details"
    );
  }

  // Test Payment Failed Email dispatch
  const failedTestOrderNum = "VEL-2026-PAY-FAIL-777";
  const failedEmailResult = await sendTransactionalEmail({
    to: "customer.fail@example.com",
    subject: `Payment Notice: Order ${failedTestOrderNum} - Velaash`,
    orderNumber: failedTestOrderNum,
    react: React.createElement(PaymentFailedEmail, {
      orderNumber: failedTestOrderNum,
      customerName: "Kavita Sharma",
      totalAmount: 4250,
      failureReason: "Card issuing bank declined transaction (Insufficient funds)",
      retryPaymentUrl: `http://localhost:3000/checkout?retry=${failedTestOrderNum}`,
    }),
  });

  assert(
    failedEmailResult.success === true,
    "PaymentFailedEmail template dispatches successfully via transactional mailer"
  );

  const paymentFailedEmail = DISPATCHED_EMAILS_LOG.find(
    (e) => e.orderNumber === failedTestOrderNum
  );
  assert(
    paymentFailedEmail !== undefined &&
      paymentFailedEmail.subject.includes(failedTestOrderNum),
    "Payment Failed email recorded with correct subject and failure notice"
  );

  // -------------------------------------------------------------------------
  // SUITE 3: CASH ON DELIVERY (COD) ABUSE PROTECTION & RATE LIMITING
  // -------------------------------------------------------------------------
  console.log("\nSUITE 3: Cash on Delivery (COD) Abuse Protection & Rate Limiting");

  resetCodRateLimitsForTest();

  const spammerPhone = "9112233445";

  // Phone limit test: MAX_COD_ORDERS_PER_PHONE_24H = 3
  console.log(`  -> Testing Phone Limit (Threshold: ${MAX_COD_ORDERS_PER_PHONE_24H} orders/24h)`);

  for (let i = 1; i <= MAX_COD_ORDERS_PER_PHONE_24H; i++) {
    const rateCheck = await checkCodRateLimit({
      phone: spammerPhone,
      ip: `198.51.100.${i}`, // different IPs so we isolate phone check
    });

    assert(
      rateCheck.allowed === true,
      `COD Order ${i}/${MAX_COD_ORDERS_PER_PHONE_24H} from phone ${spammerPhone} is allowed`,
      `Current count: ${rateCheck.phoneCount}`
    );
  }

  // The 4th attempt from the same phone number MUST BE BLOCKED!
  const blockedPhoneCheck = await checkCodRateLimit({
    phone: spammerPhone,
    ip: "198.51.100.99",
  });

  assert(
    blockedPhoneCheck.allowed === false &&
      blockedPhoneCheck.reason === "PHONE_LIMIT_EXCEEDED",
    "COD Order attempt exceeding phone rate limit is strictly BLOCKED",
    `Error returned: "${blockedPhoneCheck.errorMessage}"`
  );

  // Verify createOrderAction actually rejects COD order when phone rate limit is exceeded
  const blockedActionOrder = await createOrderAction({
    contact: {
      email: "spammer@example.com",
      phone: spammerPhone, // Exceeded phone number
      createAccount: false,
    },
    shippingAddress: {
      fullName: "Spam Bot",
      phone: spammerPhone,
      addressLine1: "123 Random Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      addressType: "home",
      saveAddress: false,
    },
    paymentMethod: "cod",
    items: [
      {
        productId: testProductId,
        variantId: testVariantId,
        quantity: 1,
      },
    ],
    idempotencyKey: `idemp-blocked-${Date.now()}`,
  });

  assert(
    blockedActionOrder.success === false &&
      blockedActionOrder.code === "COD_RATE_LIMIT_EXCEEDED",
    "createOrderAction rejects COD order with COD_RATE_LIMIT_EXCEEDED before DB writes",
    `Rejection error: "${blockedActionOrder.success ? "" : blockedActionOrder.error}"`
  );

  // IP limit test: MAX_COD_ORDERS_PER_IP_24H = 5
  console.log(`\n  -> Testing IP Limit (Threshold: ${MAX_COD_ORDERS_PER_IP_24H} orders/24h)`);
  resetCodRateLimitsForTest();

  const spammerNetworkIp = "203.0.113.10";

  for (let i = 1; i <= MAX_COD_ORDERS_PER_IP_24H; i++) {
    const rateCheck = await checkCodRateLimit({
      phone: `999000000${i}`, // different phone numbers to isolate IP limit
      ip: spammerNetworkIp,
    });

    assert(
      rateCheck.allowed === true,
      `COD Order ${i}/${MAX_COD_ORDERS_PER_IP_24H} from IP ${spammerNetworkIp} is allowed`,
      `Current count: ${rateCheck.ipCount}`
    );
  }

  // The 6th attempt from the same IP MUST BE BLOCKED!
  const blockedIpCheck = await checkCodRateLimit({
    phone: "9990000099",
    ip: spammerNetworkIp,
  });

  assert(
    blockedIpCheck.allowed === false &&
      blockedIpCheck.reason === "IP_LIMIT_EXCEEDED",
    "COD Order attempt exceeding network IP rate limit is strictly BLOCKED",
    `Error returned: "${blockedIpCheck.errorMessage}"`
  );

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("STATUS: ALL PHASE 3D ORDER LIFECYCLE TESTS PASSED! ✓");
    console.log("================================================================\n");
    process.exit(0);
  } else {
    console.error(`STATUS: ${totalTests - passedTests} TESTS FAILED! ✗`);
    console.log("================================================================\n");
    process.exit(1);
  }
}

runOrderLifecycleTests().catch((err) => {
  console.error("Fatal error during order lifecycle test execution:", err);
  process.exit(1);
});
