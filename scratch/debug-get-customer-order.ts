import { createClient } from "@supabase/supabase-js";
try { process.loadEnvFile(".env.local"); } catch {}

if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
void supabase;

async function run() {
  const { sendTransactionalEmail, DISPATCHED_EMAILS_LOG } = await import("../lib/email/resend");
  const { PaymentFailedEmail } = await import("../features/checkout/emails/payment-failed-email");
  const React = await import("react");

  const result = await sendTransactionalEmail({
    to: "customer.fail@example.com",
    subject: "Payment Notice",
    orderNumber: "VEL-TEST-999",
    react: React.createElement(PaymentFailedEmail, {
      orderNumber: "VEL-TEST-999",
      customerName: "Kavita Sharma",
      totalAmount: 4250,
      failureReason: "Card issuing bank declined transaction (Insufficient funds)",
      retryPaymentUrl: "http://localhost:3000/checkout",
    }),
  });
  console.log("Send result:", result);
  console.log("Dispatched emails log count:", DISPATCHED_EMAILS_LOG.length);
}

run().catch(console.error);
