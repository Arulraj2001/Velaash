export {};

try {
  process.loadEnvFile(".env.local");
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const sql = `
    ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS tracking_number text,
    ADD COLUMN IF NOT EXISTS courier_name text,
    ADD COLUMN IF NOT EXISTS admin_notes text;
  `;

  // Test SQL endpoints
  const endpoints = [
    `${supabaseUrl}/rest/v1/rpc/exec_sql`,
    `${supabaseUrl}/rest/v1/rpc/exec`,
    `${supabaseUrl}/pg/query`,
    `${supabaseUrl}/sql`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql, sql: sql }),
      });
      console.log(`Endpoint ${ep} status:`, res.status);
      if (res.status === 200) {
        const text = await res.text();
        console.log("Success response:", text);
        return;
      }
    } catch (e: unknown) {
      console.log(`Endpoint ${ep} error:`, e instanceof Error ? e.message : String(e));
    }
  }
}

main().catch(console.error);
