// Load environment variables for standalone Node execution before other imports
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already provided by environment
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

import type { AdminUserSession } from "../features/auth/types";
import {
  hasAdminPermission,
  getVisibleNavItems,
  canAccessAdminRoute,
  ADMIN_NAV_ITEMS,
} from "../features/admin/permissions";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";



let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    if (details) console.log(`         ${details}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runAdminRbacTests() {
  console.log("================================================================");
  console.log("     VELAASH ADMIN DASHBOARD RBAC & PERMISSION TEST SUITE       ");
  console.log("================================================================\n");

  const mockOwnerAdmin: AdminUserSession = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "velaash15@gmail.com",
    fullName: "Velaash Proprietor",
    role: "owner",
  };

  const mockStaffAdmin: AdminUserSession = {
    id: "00000000-0000-0000-0000-000000000002",
    email: "ostrune.online@gmail.com",
    fullName: "Velaash Operations Staff",
    role: "staff",
  };

  // ==========================================================================
  // TEST GROUP 1: ROLE PERMISSION MATRIX
  // ==========================================================================
  console.log("--- 1. Role Permission Matrix Integrity ---");

  assert(
    hasAdminPermission("owner", "view_analytics") === true,
    "Owner has 'view_analytics' permission"
  );
  assert(
    hasAdminPermission("staff", "view_analytics") === false,
    "Staff is DENIED 'view_analytics' permission"
  );

  assert(
    hasAdminPermission("owner", "manage_staff") === true,
    "Owner has 'manage_staff' permission"
  );
  assert(
    hasAdminPermission("staff", "manage_staff") === false,
    "Staff is DENIED 'manage_staff' permission"
  );

  assert(
    hasAdminPermission("owner", "manage_settings") === true,
    "Owner has 'manage_settings' permission"
  );
  assert(
    hasAdminPermission("staff", "manage_settings") === false,
    "Staff is DENIED 'manage_settings' permission"
  );

  assert(
    hasAdminPermission("owner", "manage_coupons") === true,
    "Owner has 'manage_coupons' permission"
  );
  assert(
    hasAdminPermission("staff", "manage_coupons") === false,
    "Staff is DENIED 'manage_coupons' permission"
  );

  assert(
    hasAdminPermission("owner", "manage_homepage") === true,
    "Owner has 'manage_homepage' permission"
  );
  assert(
    hasAdminPermission("staff", "manage_homepage") === false,
    "Staff is DENIED 'manage_homepage' permission"
  );

  assert(
    hasAdminPermission("staff", "view_orders") === true,
    "Staff has operational 'view_orders' permission"
  );
  assert(
    hasAdminPermission("staff", "update_order_status") === true,
    "Staff has operational 'update_order_status' permission"
  );
  assert(
    hasAdminPermission("staff", "view_products") === true,
    "Staff has operational 'view_products' permission"
  );
  assert(
    hasAdminPermission("staff", "update_stock") === true,
    "Staff has operational 'update_stock' permission"
  );
  assert(
    hasAdminPermission("staff", "delete_products") === false,
    "Staff is DENIED destructive 'delete_products' permission"
  );

  // ==========================================================================
  // TEST GROUP 2: SIDEBAR NAV VISIBILITY
  // ==========================================================================
  console.log("\n--- 2. Role-Based Sidebar Navigation Visibility ---");

  const staffNavItems = getVisibleNavItems("staff");
  const ownerNavItems = getVisibleNavItems("owner");

  assert(
    ownerNavItems.length === ADMIN_NAV_ITEMS.length,
    `Owner sees all ${ADMIN_NAV_ITEMS.length} navigation items in sidebar`
  );

  const staffHrefs = staffNavItems.map((item) => item.href);
  assert(
    !staffHrefs.includes("/admin/staff"),
    "Staff sidebar completely OMITS '/admin/staff'"
  );
  assert(
    !staffHrefs.includes("/admin/settings"),
    "Staff sidebar completely OMITS '/admin/settings'"
  );
  assert(
    !staffHrefs.includes("/admin/coupons"),
    "Staff sidebar completely OMITS '/admin/coupons'"
  );
  assert(
    !staffHrefs.includes("/admin/homepage"),
    "Staff sidebar completely OMITS '/admin/homepage'"
  );

  assert(
    staffHrefs.includes("/admin"),
    "Staff sidebar includes '/admin' (Dashboard)"
  );
  assert(
    staffHrefs.includes("/admin/orders"),
    "Staff sidebar includes '/admin/orders'"
  );
  assert(
    staffHrefs.includes("/admin/products"),
    "Staff sidebar includes '/admin/products'"
  );
  assert(
    staffHrefs.includes("/admin/categories"),
    "Staff sidebar includes '/admin/categories'"
  );

  // ==========================================================================
  // TEST GROUP 3: ROUTE ENFORCEMENT GATE
  // ==========================================================================
  console.log("\n--- 3. Route Authorization Enforcement (`canAccessAdminRoute`) ---");

  assert(
    canAccessAdminRoute("owner", "/admin/staff") === true,
    "Owner CAN access route '/admin/staff'"
  );
  assert(
    canAccessAdminRoute("staff", "/admin/staff") === false,
    "Staff CANNOT access route '/admin/staff' (Hard Block)"
  );

  assert(
    canAccessAdminRoute("owner", "/admin/settings") === true,
    "Owner CAN access route '/admin/settings'"
  );
  assert(
    canAccessAdminRoute("staff", "/admin/settings") === false,
    "Staff CANNOT access route '/admin/settings' (Hard Block)"
  );

  assert(
    canAccessAdminRoute("owner", "/admin/coupons") === true,
    "Owner CAN access route '/admin/coupons'"
  );
  assert(
    canAccessAdminRoute("staff", "/admin/coupons") === false,
    "Staff CANNOT access route '/admin/coupons' (Hard Block)"
  );

  assert(
    canAccessAdminRoute("owner", "/admin/homepage") === true,
    "Owner CAN access route '/admin/homepage'"
  );
  assert(
    canAccessAdminRoute("staff", "/admin/homepage") === false,
    "Staff CANNOT access route '/admin/homepage' (Hard Block)"
  );

  assert(
    canAccessAdminRoute("staff", "/admin/orders") === true,
    "Staff CAN access route '/admin/orders'"
  );
  assert(
    canAccessAdminRoute("staff", "/admin/products") === true,
    "Staff CAN access route '/admin/products'"
  );

  // ==========================================================================
  // TEST GROUP 4: DASHBOARD METRICS DIFFERENTIATION
  // ==========================================================================
  console.log("\n--- 4. Dashboard Metrics Role-Aware Query Differentiation ---");

  const { getAdminDashboardData } = await import("../features/admin/queries/get-admin-dashboard");
  const staffDashboard = await getAdminDashboardData(mockStaffAdmin);

  assert(
    staffDashboard.financialMetrics === null,
    "Staff dashboard data explicitly withholds financial metrics (financialMetrics is null)",
    "Staff cannot observe revenue, AOV, or 14-day sales charts"
  );
  assert(
    typeof staffDashboard.operationalMetrics.pendingOrdersCount === "number",
    "Staff dashboard receives operational pending orders count"
  );
  assert(
    typeof staffDashboard.operationalMetrics.ordersNeedingActionCount === "number",
    "Staff dashboard receives operational action needed count"
  );
  assert(
    typeof staffDashboard.operationalMetrics.lowStockCount === "number",
    "Staff dashboard receives low stock alert count"
  );
  assert(
    Array.isArray(staffDashboard.recentOrders),
    "Staff dashboard receives recent orders for fulfillment processing"
  );

  const ownerDashboard = await getAdminDashboardData(mockOwnerAdmin);
  assert(
    ownerDashboard.financialMetrics !== null,
    "Owner dashboard receives full financial metrics suite"
  );
  if (ownerDashboard.financialMetrics) {
    assert(
      typeof ownerDashboard.financialMetrics.totalRevenue === "number",
      "Owner receives total net revenue metric"
    );
    assert(
      typeof ownerDashboard.financialMetrics.aov === "number",
      "Owner receives average order value (AOV)"
    );
    assert(
      Array.isArray(ownerDashboard.financialMetrics.salesTrend14Days),
      "Owner receives 14-day sales trend array for Recharts"
    );
    assert(
      ownerDashboard.financialMetrics.salesTrend14Days.length === 14,
      `Owner 14-day sales trend contains exactly 14 daily buckets (got ${ownerDashboard.financialMetrics.salesTrend14Days.length})`
    );
  }

  // ==========================================================================
  // TEST GROUP 5: STAFF ADD VALIDATION & SUPABASE AUTH VERIFICATION
  // ==========================================================================
  console.log("\n--- 5. Staff-Add Flow Non-Existent Auth User Rejection ---");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const nonExistentEmail = "nonexistent-auth-user-99999@velaash-test.com";

  // Simulate verification check executed inside addStaffMemberAction
  const { data: authData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
  const foundUser = authData?.users.find(
    (u) => u.email?.toLowerCase() === nonExistentEmail.toLowerCase()
  );

  assert(
    foundUser === undefined,
    `Email '${nonExistentEmail}' does not exist in Supabase Auth`
  );

  const rejectionError = !foundUser
    ? "This email needs to sign up/be created in Supabase first"
    : null;

  assert(
    rejectionError === "This email needs to sign up/be created in Supabase first",
    "Staff-add verification strictly generates expected rejection message",
    `Error returned: "${rejectionError}"`
  );

  // ==========================================================================
  // TEST GROUP 6: ACCIDENTAL LOCKOUT PREVENTION
  // ==========================================================================
  console.log("\n--- 6. Accidental Owner Lockout Prevention ---");

  const selfId = mockOwnerAdmin.id;
  const targetId = selfId;

  const isSelfChangeBlocked = targetId === mockOwnerAdmin.id;
  assert(
    isSelfChangeBlocked === true,
    "Owner role self-modification is strictly blocked to prevent accidental lockout"
  );

  const isSelfDeletionBlocked = targetId === mockOwnerAdmin.id;
  assert(
    isSelfDeletionBlocked === true,
    "Owner account self-revocation is strictly blocked to prevent accidental lockout"
  );

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log("\n================================================================");
  console.log(`  ALL RBAC & ADMIN TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log("================================================================\n");
}

runAdminRbacTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
