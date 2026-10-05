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

  const { count: prodCount } = await admin.from("products").select("*", { count: "exact", head: true });
  const { count: varCount } = await admin.from("product_variants").select("*", { count: "exact", head: true });
  console.log(`Total products: ${prodCount}, Total variants: ${varCount}`);

  const { data: prods } = await admin.from("products").select("id, name, is_active").limit(5);
  console.log("Sample products:", prods);

  const { data: vars } = await admin.from("product_variants").select("id, product_id, is_active, stock_quantity").limit(5);
  console.log("Sample variants:", vars);
}

main().catch(console.error);
