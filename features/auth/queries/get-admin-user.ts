import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AdminPermission, AdminUserSession, AdminRole } from "../types";

import { hasAdminPermission } from "@/features/admin/permissions";
export { hasAdminPermission };

/**
 * Retrieves the current authenticated admin user session and role.
 * - Short-circuits with 0 database round trips if middleware already validated the token.
 * - Memoized via React cache() so layout, page, and requireAdmin share the exact same session.
 * - Returns null if not logged in or if user is not in the admin_users table.
 */
export const getAdminUser = cache(async function getAdminUser(): Promise<AdminUserSession | null> {
  // 1. Fast path: check if middleware already verified and attached admin headers
  try {
    const headersList = await headers();
    const headerAdminId = headersList.get("x-admin-user-id");
    const headerAdminRole = headersList.get("x-admin-user-role");
    if (headerAdminId && headerAdminRole) {
      return {
        id: headerAdminId,
        email: headersList.get("x-admin-user-email") || "",
        fullName: headersList.get("x-admin-user-name") || "",
        role: headerAdminRole as AdminRole,
      };
    }
  } catch {
    // headers() might throw outside a standard Next.js request context
  }

  // 2. Direct Supabase verification (for Server Actions or contexts without middleware headers)
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
});

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
