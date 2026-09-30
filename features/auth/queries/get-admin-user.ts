import { createClient } from "@/lib/supabase/server";
import type { AdminPermission, AdminUserSession } from "../types";


import { hasAdminPermission } from "@/features/admin/permissions";
export { hasAdminPermission };

/**
 * Retrieves the current authenticated admin user session and role.
 * Returns null if not logged in or if user is not in the admin_users table.
 */
export async function getAdminUser(): Promise<AdminUserSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      return null;
    }

    return {
      id: adminRecord.id,
      email: user.email ?? "",
      fullName: adminRecord.full_name,
      role: adminRecord.role,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to query admin user session:", error);
    return null;
  }
}

/**
 * Strict server-side check ensuring current caller has administrative rights.
 * Throws an error or returns the session for use in Server Actions / API routes.
 */
export async function requireAdmin(
  requiredPermission?: AdminPermission
): Promise<AdminUserSession> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("UNAUTHORIZED_ADMIN_ACCESS");
  }

  if (requiredPermission && !hasAdminPermission(admin.role, requiredPermission)) {
    throw new Error("FORBIDDEN_INSUFFICIENT_PERMISSIONS");
  }

  return admin;
}

/**
 * Helper to check if caller is an owner.
 */
export async function requireOwner(): Promise<AdminUserSession> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") {
    throw new Error("FORBIDDEN_OWNER_REQUIRED");
  }
  return admin;
}
