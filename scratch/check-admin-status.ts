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
  const adminClient = createAdminClient();

  const { data: usersData, error: usersErr } =
    await adminClient.auth.admin.listUsers();
  if (usersErr) {
    console.error("Error listing users:", usersErr);
    return;
  }

  const owner = usersData.users.find(
    (u) => u.email?.toLowerCase() === "velaash15@gmail.com"
  );
  console.log("Owner auth.users row:", {
    id: owner?.id,
    email: owner?.email,
    confirmed_at: owner?.email_confirmed_at,
    last_sign_in_at: owner?.last_sign_in_at,
    created_at: owner?.created_at,
    app_metadata: owner?.app_metadata,
    user_metadata: owner?.user_metadata,
  });

  const { data: adminUsers, error: adminErr } = await adminClient
    .from("admin_users")
    .select("*");
  console.log("admin_users table rows:", adminUsers, "Error:", adminErr);
}

main().catch(console.error);
