export {};

// Load environment variables for standalone Node execution
try { process.loadEnvFile(".env.local"); } catch {}

// Mock server-only for standalone script execution outside Next.js bundler
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require("node:module");
const originalRequire = Module.prototype.require;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Module.prototype.require = function (path: string, ...args: any[]) {
  if (path === "server-only") {
    return {};
  }
  return originalRequire.apply(this, [path, ...args]);
};

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-project-ref.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key-12345";
}

async function testAdminOrderNotification() {
  console.log("=== SUITE: Admin Order Notification Dispatch ===");

  const { sendAdminOrderNotificationEmail } = await import(
    "../features/checkout/services/send-admin-order-notification"
  );
  const { DISPATCHED_EMAILS_LOG } = await import("../lib/email/resend");

  DISPATCHED_EMAILS_LOG.length = 0;

  // Set explicit test admin email
  process.env.ADMIN_NOTIFICATION_EMAIL = "admin.owner@example.com";

  // Test 1: COD Order Notification
  console.log("\n[Test 1] Dispatching Admin notification for COD Order...");
  await sendAdminOrderNotificationEmail({
    orderNumber: "VEL-COD-1001",
    paymentMethod: "cod",
    paymentStatus: "pending",
    items: [
      {
        title: "Pure Cotton Casual Kurta",
        size: "L",
        color: "Indigo Blue",
        quantity: 2,
        unitPrice: 1299,
        lineSubtotal: 2598,
      },
      {
        title: "Brass Diya Lamp (Traditional)",
        size: "Medium",
        quantity: 1,
        unitPrice: 499,
        lineSubtotal: 499,
      },
    ],
    subtotal: 3097,
    discountAmount: 200,
    couponCode: "FESTIVE200",
    shippingCharge: 0,
    codHandlingFee: 50,
    totalAmount: 2947,
    customer: {
      fullName: "Priya Sundaram",
      email: "priya.sundaram@example.com",
      phone: "+91 98765 43210",
    },
    shippingAddress: {
      fullName: "Priya Sundaram",
      phone: "+91 98765 43210",
      addressLine1: "Flat 4B, Lotus Apartments, 12th Cross",
      addressLine2: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    },
  });

  const codEmail = DISPATCHED_EMAILS_LOG.find(
    (e) => e.orderNumber === "VEL-COD-1001" && e.to === "admin.owner@example.com"
  );

  if (!codEmail) {
    throw new Error("FAIL: COD admin order email was not dispatched!");
  }
  console.log("✓ PASS: COD admin notification received at:", codEmail.to);
  console.log("✓ Subject:", codEmail.subject);
  if (!codEmail.subject.includes("COD") || !codEmail.subject.includes("VEL-COD-1001")) {
    throw new Error("FAIL: Subject line missing COD or order number");
  }
  if (!codEmail.text?.includes("Priya Sundaram") || !codEmail.text?.includes("Bengaluru")) {
    throw new Error("FAIL: Plain text missing customer or address details");
  }
  console.log("✓ PASS: COD email content verified.");

  // Test 2: Online Paid Order Notification
  console.log("\n[Test 2] Dispatching Admin notification for Razorpay Paid Order...");
  await sendAdminOrderNotificationEmail({
    orderNumber: "VEL-RP-2002",
    paymentMethod: "razorpay",
    paymentStatus: "paid",
    items: [
      {
        title: "Silk Festive Saree",
        color: "Crimson Red",
        quantity: 1,
        unitPrice: 4999,
        lineSubtotal: 4999,
      },
    ],
    subtotal: 4999,
    shippingCharge: 0,
    totalAmount: 4999,
    customer: {
      fullName: "Ananya Sharma",
      email: "ananya.sharma@example.com",
      phone: "+91 98450 11223",
    },
    shippingAddress: {
      fullName: "Ananya Sharma",
      phone: "+91 98450 11223",
      addressLine1: "15, Green Glen Layout",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600028",
    },
  });

  const paidEmail = DISPATCHED_EMAILS_LOG.find(
    (e) => e.orderNumber === "VEL-RP-2002" && e.to === "admin.owner@example.com"
  );

  if (!paidEmail) {
    throw new Error("FAIL: Paid admin order email was not dispatched!");
  }
  console.log("✓ PASS: Paid admin notification received at:", paidEmail.to);
  console.log("✓ Subject:", paidEmail.subject);
  if (!paidEmail.subject.includes("Paid") || !paidEmail.subject.includes("VEL-RP-2002")) {
    throw new Error("FAIL: Subject line missing Paid status or order number");
  }
  console.log("✓ PASS: Paid email content verified.");

  // Test 3: Graceful Skip when no email is configured
  console.log("\n[Test 3] Verifying graceful skip when admin email is absent...");
  const preCount = DISPATCHED_EMAILS_LOG.length;
  await sendAdminOrderNotificationEmail({
    orderNumber: "VEL-NO-EMAIL-3003",
    paymentMethod: "cod",
    paymentStatus: "pending",
    items: [],
    subtotal: 100,
    shippingCharge: 0,
    totalAmount: 100,
    customer: { fullName: "Test", email: "test@example.com", phone: "123" },
    shippingAddress: {
      fullName: "Test",
      phone: "123",
      addressLine1: "Test",
      city: "City",
      state: "State",
      pincode: "123456",
    },
    adminEmailOverride: "",
  });

  if (DISPATCHED_EMAILS_LOG.length !== preCount) {
    throw new Error("FAIL: Expected email to be safely skipped when no admin address configured!");
  }
  console.log("✓ PASS: Graceful skip succeeded without error or unexpected dispatch.");

  console.log("\n==============================================");
  console.log("ALL ADMIN ORDER NOTIFICATION TESTS PASSED! 🎉");
  console.log("==============================================");
}

testAdminOrderNotification().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
