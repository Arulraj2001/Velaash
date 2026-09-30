export {};

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

async function main() {
  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();

  // Find all active products with active variants
  const { data } = await admin
    .from("product_variants")
    .select("id, product_id, is_active, stock_quantity, products ( id, name, is_active, base_price )")
    .limit(20);

  const active = data?.filter((v) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = v.products as any;
    return v.is_active && p && p.is_active && v.stock_quantity > 0;
  });

  console.log("Active product variants found:", active);

  if (!active || active.length === 0) {
    // Let's activate c1111111-1111-4111-c111-000000000001
    await admin.from("products").update({ is_active: true }).eq("id", "c1111111-1111-4111-c111-000000000001");
    console.log("Activated product c1111111-1111-4111-c111-000000000001");
  }
}

main().catch(console.error);
