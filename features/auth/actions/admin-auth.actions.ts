"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AdminLoginSchema,
  type AdminLoginInput,
  type AuthActionResult,
  type AdminUserSession,
} from "../types";

import {
  checkAdminLoginRateLimit,
  recordFailedAdminLoginAttempt,
  clearAdminLoginRateLimit,
} from "@/lib/rate-limit";

/**
 * Admin authentication action with email + password and strict RBAC verification.
 */
export async function signInAdminAction(
  input: AdminLoginInput
): Promise<AuthActionResult<AdminUserSession>> {
  const parsed = AdminLoginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid email or password format.",
    };
  }

  // Derive client IP for brute force throttling
  const headerList = await headers();
  const clientIp = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userEmail = parsed.data.email.toLowerCase();

  const rateCheck = await checkAdminLoginRateLimit(clientIp, userEmail);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: rateCheck.errorMessage || "Too many failed login attempts. Access is locked for 15 minutes for security.",
    };
  }

  try {
    const supabase = await createClient();

    // 1. Authenticate with Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (authError || !user) {
      await recordFailedAdminLoginAttempt(clientIp, userEmail);
      // Generic error: never reveal if email exists
      return {
        success: false,
        error: "Access denied. Invalid credentials.",
      };
    }

    // 2. Strict RBAC verification against admin_users table
    const { data: adminRecord, error: adminQueryError } = await supabase
      .from("admin_users")
      .select("id, role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (adminQueryError || !adminRecord) {
      // User is authenticated in Supabase but is NOT an authorized admin (e.g. regular customer)
      // Immediately revoke session and treat as failed attempt
      await supabase.auth.signOut();
      await recordFailedAdminLoginAttempt(clientIp, userEmail);
      return {
        success: false,
        error: "Access denied. Invalid credentials.",
      };
    }

    // Clear failed attempts upon successful authorized login
    await clearAdminLoginRateLimit(clientIp, userEmail);
    revalidatePath("/admin", "layout");

    return {
      success: true,
      message: `Welcome back, ${adminRecord.full_name}.`,
      data: {
        id: adminRecord.id,
        email: user.email ?? "",
        fullName: adminRecord.full_name,
        role: adminRecord.role,
      },
    };
  } catch (err) {
    console.error("Admin sign-in error:", err);
    await recordFailedAdminLoginAttempt(clientIp, userEmail);
    return {
      success: false,
      error: "Access denied. Invalid credentials.",
    };
  }
}

/**
 * Signs the admin user out and invalidates administrative cookies.
 */
export async function signOutAdminAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
