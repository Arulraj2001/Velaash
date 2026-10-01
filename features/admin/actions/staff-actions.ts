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
  password: z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * Retrieves the full list of admin users joined with their Supabase Auth email addresses.
 * Server-side gated: Owner only.
 */
export async function getAdminUsersList(): Promise<AdminUserListItem[]> {
  await requireOwner();

  // Elevate to service role to list admin records and resolve their auth emails
  const adminSupabase = createAdminClient();

  const { data: adminRecords, error: adminErr } = await adminSupabase
    .from("admin_users")
    .select("id, role, full_name, created_at")
    .order("created_at", { ascending: true });

  if (adminErr) {
    console.error("Failed to query admin_users:", adminErr);
    throw new Error("Failed to load admin user records.");
  }

  if (!adminRecords || adminRecords.length === 0) {
    return [];
  }

  // Fetch auth user records for the exact admin accounts in parallel (immune to pagination caps)
  const items = await Promise.all(
    adminRecords.map(async (record) => {
      try {
        const { data: authUser, error: userErr } =
          await adminSupabase.auth.admin.getUserById(record.id);

        return {
          id: record.id,
          email:
            !userErr && authUser?.user?.email
              ? authUser.user.email
              : "Email unavailable",
          fullName: record.full_name,
          role: record.role,
          createdAt: record.created_at,
        };
      } catch {
        return {
          id: record.id,
          email: "Email unavailable",
          fullName: record.full_name,
          role: record.role,
          createdAt: record.created_at,
        };
      }
    })
  );

  return items;
}

/**
 * Adds an existing Supabase Auth user as a staff member in admin_users,
 * or provisions a new Auth user if password is provided.
 */
export async function addStaffMemberAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await requireOwner();

    const rawEmail = formData.get("email")?.toString() ?? "";
    const rawFullName = formData.get("fullName")?.toString() ?? "";
    const rawPassword = formData.get("password")?.toString() ?? "";

    const validation = AddStaffSchema.safeParse({
      email: rawEmail,
      fullName: rawFullName,
      password: rawPassword,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Invalid input provided.",
      };
    }

    const { email, fullName, password } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Search for existing user in Supabase Auth (supports pagination across pages)
    let existingAuthUser: { id: string; user_metadata?: { full_name?: string } } | null = null;
    let page = 1;
    const perPage = 1000;

    while (!existingAuthUser) {
      const { data: authData, error: listErr } = await adminSupabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listErr) {
        console.error("Failed to query auth.users:", listErr);
        return { success: false, error: "Failed to verify authentication records." };
      }

      const match = authData?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (match) {
        existingAuthUser = match;
        break;
      }

      // If page has fewer than perPage records, we reached the end of users
      if (!authData?.users || authData.users.length < perPage) {
        break;
      }
      page++;
    }

    // 2. If user does not exist in Auth
    if (!existingAuthUser) {
      if (password && password.length >= 6) {
        const { data: newUser, error: createAuthErr } =
          await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName || email.split("@")[0],
            },
          });

        if (createAuthErr || !newUser?.user) {
          console.error("Failed to create new auth user for staff:", createAuthErr);
          return {
            success: false,
            error: createAuthErr?.message || "Failed to create staff account.",
          };
        }
        existingAuthUser = newUser.user;
      } else {
        return {
          success: false,
          error: "This email needs to sign up/be created in Supabase first",
        };
      }
    }

    // 3. Check if already provisioned as an admin
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

    // 4. Provision as staff member in admin_users
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
