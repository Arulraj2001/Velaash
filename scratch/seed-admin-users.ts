import { createClient } from "@supabase/supabase-js";

import type { Database, AdminRole } from "../types/database.types";

// Load environment variables for standalone Node execution
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already loaded in environment
}

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface TargetAdminUser {
  email: string;
  role: AdminRole;
  fullName: string;
}

const TARGET_ADMINS: TargetAdminUser[] = [
  {
    email: "velaash15@gmail.com",
    role: "owner",
    fullName: "Velaash Proprietor",
  },
  {
    email: "ostrune.online@gmail.com",
    role: "staff",
    fullName: "Velaash Operations Staff",
  },
];

async function seedAdminUsers() {
  console.log("================================================================================");
  console.log("                 VELAASH ADMIN ACCOUNTS PROVISIONING SETUP                      ");
  console.log("================================================================================");
  console.log("SEQUENCE OF EXECUTION INSTRUCTIONS:");
  console.log(" 1. The store administrator/client must first create the two users in Supabase:");
  console.log("    - Open Supabase Project Dashboard -> Authentication -> Users -> Add User");
  console.log("    - Account 1: velaash15@gmail.com (Set password, check 'Auto Confirm Email')");
  console.log("    - Account 2: ostrune.online@gmail.com (Set password, check 'Auto Confirm Email')");
  console.log(" 2. Run this script:");
  console.log("    npx tsx scratch/seed-admin-users.ts");
  console.log(" 3. This script links the auth records to PostgreSQL public.admin_users table:");
  console.log("    - velaash15@gmail.com     => role = 'owner'");
  console.log("    - ostrune.online@gmail.com   => role = 'staff'");
  console.log("================================================================================\n");

  console.log("Connecting to Supabase Auth & querying existing users...");
  const { data: authData, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listErr) {
    console.error("[FATAL] Could not retrieve users from Supabase Auth:", listErr.message);
    process.exit(1);
  }

  const existingAuthUsers = authData?.users ?? [];
  console.log(`Found ${existingAuthUsers.length} total user(s) in auth.users.\n`);

  let allProvisioned = true;

  for (const target of TARGET_ADMINS) {
    console.log(`Checking target: ${target.email} (${target.role.toUpperCase()})`);

    const authUser = existingAuthUsers.find(
      (u) => u.email?.toLowerCase() === target.email.toLowerCase()
    );

    if (!authUser) {
      console.warn(`  [NOT FOUND IN AUTH] ${target.email}`);
      console.warn(`  -> Please create this user in Supabase Dashboard first with a password.`);
      allProvisioned = false;
      continue;
    }

    console.log(`  [OK] Found auth user with ID: ${authUser.id}`);

    // Check if already present in public.admin_users
    const { data: existingAdmin, error: adminQueryErr } = await supabase
      .from("admin_users")
      .select("id, role, full_name")
      .eq("id", authUser.id)
      .maybeSingle();

    if (adminQueryErr) {
      console.error(`  [ERROR] Failed to query admin_users for ${target.email}:`, adminQueryErr.message);
      allProvisioned = false;
      continue;
    }

    if (existingAdmin) {
      if (existingAdmin.role === target.role) {
        console.log(`  [ALREADY CONFIGURED] Already has role '${existingAdmin.role}' and full_name '${existingAdmin.full_name}'.\n`);
      } else {
        console.log(`  [ROLE UPDATE] Updating role from '${existingAdmin.role}' to '${target.role}'...`);
        const { error: updateErr } = await supabase
          .from("admin_users")
          .update({
            role: target.role,
            full_name: target.fullName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (updateErr) {
          console.error(`  [FAIL] Failed to update role:`, updateErr.message);
          allProvisioned = false;
        } else {
          console.log(`  [SUCCESS] Role successfully updated to '${target.role}'.\n`);
        }
      }
    } else {
      console.log(`  [PROVISIONING] Inserting record into public.admin_users...`);
      const { error: insertErr } = await supabase.from("admin_users").insert({
        id: authUser.id,
        role: target.role,
        full_name: target.fullName,
      });

      if (insertErr) {
        console.error(`  [FAIL] Failed to insert admin user:`, insertErr.message);
        allProvisioned = false;
      } else {
        console.log(`  [SUCCESS] Granted role '${target.role}' to ${target.email} (ID: ${authUser.id}).\n`);
      }
    }
  }

  console.log("--------------------------------------------------------------------------------");
  if (allProvisioned) {
    console.log("ALL REAL ADMIN ACCOUNTS SUCCESSFULLY CONFIGURED AND VERIFIED!");
  } else {
    console.log("SOME ACCOUNTS REQUIRE ACTION: Create the missing users in Supabase Dashboard, then re-run.");
  }
  console.log("--------------------------------------------------------------------------------\n");
}

seedAdminUsers().catch((err) => {
  console.error("Unhandled exception in seed script:", err);
  process.exit(1);
});
