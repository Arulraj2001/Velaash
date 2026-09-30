import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}

// Node < 22 WebSocket shim for @supabase/realtime-js
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
  const { data, error } = await supabase.from("orders").select("*").limit(1);
  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Order columns present:", Object.keys(data[0]));
    console.log("Has tracking_number:", "tracking_number" in data[0]);
    console.log("Has courier_name:", "courier_name" in data[0]);
    console.log("Has admin_notes:", "admin_notes" in data[0]);
  } else {
    console.log("No orders in table yet, testing insert with tracking columns...");
  }
}

main().catch(console.error);
