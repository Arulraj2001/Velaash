"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/types/database.types";
import type { AdminUserListItem } from "../types";

const AddStaffSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  fullName: z.string().trim().optional(),
});

/**
 * Retrieves the full list of admin users joined with their Supabase Auth email addresses.
 * Server-side gated: Owner only.
 */
export async function getAdminUsersList(): Promise<AdminUserListItem[]> {
  await requireOwner();

  // Elevate to service role to list auth users and map their IDs to email addresses
  const adminSupabase = createAdminClient();

  const [{ data: adminRecords, error: adminErr }, { data: authData, error: authErr }] =
    await Promise.all([
      adminSupabase
        .from("admin_users")
        .select("id, role, full_name, created_at")
        .order("created_at", { ascending: true }),
      adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  if (adminErr) {
    console.error("Failed to query admin_users:", adminErr);
    throw new Error("Failed to load admin user records.");
  }

  const emailMap = new Map<string, string>();
  if (!authErr && authData?.users) {
    for (const u of authData.users) {
      if (u.email) emailMap.set(u.id, u.email);
    }
  }

  return (adminRecords ?? []).map((record) => ({
    id: record.id,
    email: emailMap.get(record.id) || "Email unavailable",
    fullName: record.full_name,
    role: record.role,
    createdAt: record.created_at,
  }));
}

/**
 * Adds an existing Supabase Auth user as a staff member in admin_users.
 * Rejects the action if the email does not exist in auth.users.
 */
export async function addStaffMemberAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await requireOwner();

    const rawEmail = formData.get("email")?.toString() ?? "";
    const rawFullName = formData.get("fullName")?.toString() ?? "";

    const validation = AddStaffSchema.safeParse({
      email: rawEmail,
      fullName: rawFullName,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Invalid input provided.",
      };
    }

    const { email, fullName } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Verify that this email already exists in Supabase Auth
    const { data: authData, error: listErr } = await adminSupabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listErr) {
      console.error("Failed to query auth.users:", listErr);
      return { success: false, error: "Failed to verify authentication records." };
    }

    const existingAuthUser = authData?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!existingAuthUser) {
      return {
        success: false,
        error: "This email needs to sign up/be created in Supabase first",
      };
    }

    // 2. Check if already provisioned as an admin
    const { data: existingAdmin } = await adminSupabase
      .from("admin_users")
      .select("id, role")
      .eq("id", existingAuthUser.id)
      .maybeSingle();

    if (existingAdmin) {
      return {
        success: false,
        error: `This user already holds administrative access with role '${existingAdmin.role}'.`,
      };
    }

    // 3. Provision as staff member in admin_users
    const resolvedName =
      fullName ||
      existingAuthUser.user_metadata?.full_name ||
      email.split("@")[0];

    const { error: insertErr } = await adminSupabase.from("admin_users").insert({
      id: existingAuthUser.id,
      role: "staff",
      full_name: resolvedName,
    });

    if (insertErr) {
      console.error("Failed to insert staff member:", insertErr);
      return { success: false, error: "Failed to grant staff role. Please try again." };
    }

    revalidatePath("/admin/staff");
    return { success: true, message: `Staff role successfully assigned to ${email}.` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized operation";
    return { success: false, error: message };
  }
}

/**
 * Changes an admin member's role (owner <-> staff).
 * Prevents the caller from modifying their own role to prevent lockout.
 */
export async function updateStaffRoleAction(
  userId: string,
  newRole: AdminRole
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const caller = await requireOwner();

    if (userId === caller.id) {
      return {
        success: false,
        error: "You cannot change your own role to prevent accidental lockout.",
      };
    }

    if (newRole !== "owner" && newRole !== "staff") {
      return { success: false, error: "Invalid role specified." };
    }

    const adminSupabase = createAdminClient();
    const { error: updateErr } = await adminSupabase
      .from("admin_users")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateErr) {
      console.error("Failed to update admin role:", updateErr);
      return { success: false, error: "Database error while updating role." };
    }

    revalidatePath("/admin/staff");
    return { success: true, message: `Role successfully updated to ${newRole}.` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized operation";
    return { success: false, error: message };
  }
}

/**
 * Revokes admin access by deleting the member from admin_users.
 * Prevents the caller from deleting their own account to prevent lockout.
 */
export async function removeStaffMemberAction(
  userId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const caller = await requireOwner();

    if (userId === caller.id) {
      return {
        success: false,
        error: "You cannot revoke your own owner access to prevent accidental lockout.",
      };
    }

    const adminSupabase = createAdminClient();
    const { error: deleteErr } = await adminSupabase
      .from("admin_users")
      .delete()
      .eq("id", userId);

    if (deleteErr) {
      console.error("Failed to delete admin member:", deleteErr);
      return { success: false, error: "Failed to remove staff member." };
    }

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff access successfully revoked." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized operation";
    return { success: false, error: message };
  }
}
