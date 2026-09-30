import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}

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

async function main() {
  console.log("Checking if tracking columns can be written or exist...");
  
  // Check if an order exists
  const { data: order } = await supabase.from("orders").select("id, notes").limit(1).maybeSingle();
  if (order) {
    // Test updating with tracking_number
    const { error: testErr } = await supabase
      .from("orders")
      .update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tracking_number: "TEST-TRACK-123" as any,
      })
      .eq("id", order.id);

    console.log("Result of updating tracking_number column directly:", testErr);
  }
}

main().catch(console.error);
