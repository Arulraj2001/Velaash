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

  const { data: testInsert, error: insertErr } = await admin
    .from("homepage_sections")
    .insert({
      section_type: "newsletter" as unknown as "hero_banner",
      title: "Newsletter",
      display_order: 5,
      is_active: true,
      content: { headline: "Join the Velaash Circle", subtext: "Subscribe for updates" },
    })
    .select();

  console.log("Insert newsletter test result:", testInsert, "error:", insertErr);

  if (testInsert && testInsert.length > 0) {
    // clean up test insert
    await admin.from("homepage_sections").delete().eq("id", testInsert[0].id);
    console.log("Cleaned up test row");
  }
}

main().catch(console.error);
