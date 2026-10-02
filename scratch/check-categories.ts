export {};

try {
  process.loadEnvFile(".env.local");
} catch {}

async function check() {
  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("categories")
    .select("id, name, slug, parent_id, display_order, is_active")
    .order("display_order");
  console.log("Categories in DB:", JSON.stringify(data, null, 2));

  const { data: prod } = await admin.from("products").select("*").limit(1);
  if (prod && prod[0]) {
    console.log("Product columns:", Object.keys(prod[0]));
  }
}

check().catch(console.error);
