"use client";

import React, { useState, useRef, useTransition, useActionState } from "react";
import type { AdminUserSession } from "@/features/auth/types";
import type { AdminUserListItem } from "../types";
import type { AdminRole } from "@/types/database.types";
import {
  addStaffMemberAction,
  setStaffPasswordAction,
  updateStaffRoleAction,
  removeStaffMemberAction,
} from "../actions/staff-actions";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  AlertTriangle,
  KeyRound,
} from "lucide-react";
import { AdminModal } from "./admin-modal";

interface StaffManagementViewProps {
  currentAdmin: AdminUserSession;
  staffMembers: AdminUserListItem[];
}

export function StaffManagementView({
  currentAdmin,
  staffMembers,
}: StaffManagementViewProps) {
  const [isPending, startTransition] = useTransition();
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [memberToRevoke, setMemberToRevoke] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [memberToSetPassword, setMemberToSetPassword] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Form action for adding staff
  const [, formAction, isFormPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      setFeedback(null);
      const res = await addStaffMemberAction(prev, formData);
      if (res.success) {
        formRef.current?.reset();
        if (res.message) {
          setFeedback({ type: "success", message: res.message });
        }
      } else if (!res.success && res.error) {
        setFeedback({ type: "error", message: res.error });
      }
      return res;
    },
    null
  );

  const handleRoleChange = (userId: string, newRole: AdminRole) => {
    setFeedback(null);
    setActiveMemberId(userId);
    startTransition(async () => {
      try {
        const res = await updateStaffRoleAction(userId, newRole);
        if (res.success && res.message) {
          setFeedback({ type: "success", message: res.message });
        } else if (!res.success && res.error) {
          setFeedback({ type: "error", message: res.error });
        }
      } finally {
        setActiveMemberId(null);
      }
    });
  };

  const confirmRevoke = () => {
    if (!memberToRevoke) return;
    const { id } = memberToRevoke;
    setFeedback(null);
    setActiveMemberId(id);
    startTransition(async () => {
      try {
        const res = await removeStaffMemberAction(id);
        if (res.success && res.message) {
          setFeedback({ type: "success", message: res.message });
        } else if (!res.success && res.error) {
          setFeedback({ type: "error", message: res.error });
        }
      } finally {
        setActiveMemberId(null);
        setMemberToRevoke(null);
      }
    });
  };

  const closeSetPasswordModal = () => {
    setMemberToSetPassword(null);
    setNewPassword("");
  };

  const handleSetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberToSetPassword || !newPassword) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await setStaffPasswordAction(memberToSetPassword.id, newPassword);
      if (res.success && res.message) {
        setFeedback({ type: "success", message: res.message });
        closeSetPasswordModal();
      } else if (!res.success && res.error) {
        setFeedback({ type: "error", message: res.error });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {feedback && (
        <div
          className={`flex items-start justify-between gap-2.5 rounded-lg border p-3.5 text-xs font-medium transition-all ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-start gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: List + Add Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Admin Users Table */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Active Staff &amp; Owners ({staffMembers.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75">
                  <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    User
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    Role
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    Date Added
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((member) => {
                  const isCurrent = member.id === currentAdmin.id;
                  const isOwner = member.role === "owner";
                  const isRowUpdating = activeMemberId === member.id && isPending;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{member.fullName}</span>
                              {isCurrent && (
                                <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                            <Shield className="h-3 w-3" />
                            Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            <ShieldAlert className="h-3 w-3" />
                            Staff
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(member.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isCurrent ? (
                          <span className="text-[11px] text-slate-400 italic">Protected</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {isRowUpdating && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                            )}

                            {/* Role Toggle Selector */}
                            <select
                              disabled={isPending}
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value as AdminRole)
                              }
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-indigo-500 disabled:opacity-50"
                            >
                              <option value="staff">Staff</option>
                              <option value="owner">Owner</option>
                            </select>

                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                setMemberToSetPassword({
                                  id: member.id,
                                  email: member.email,
                                  name: member.fullName,
                                })
                              }
                              title="Set staff password"
                              className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>

                            {/* Revoke Access Button */}
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                setMemberToRevoke({
                                  id: member.id,
                                  email: member.email,
                                  name: member.fullName,
                                })
                              }
                              title="Revoke access"
                              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Add Staff Member Form */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Add Staff Member</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Grant administrative dashboard access with role{" "}
              <strong className="text-slate-700">staff</strong>. If they already signed up in Supabase,
              leave the password blank. If they are a new team hire, provide an initial password to create their account directly.
            </p>

            <form ref={formRef} action={formAction} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Auth User Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. staff@velaash.in"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Name (Optional)
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Initial Password <span className="text-slate-400 font-normal">(Optional — if new)</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={6}
                  placeholder="Min. 6 chars (for brand new accounts)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Leave blank if the user already registered in Supabase.
                </p>
              </div>

              <button
                type="submit"
                disabled={isFormPending || isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isFormPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying &amp; Adding...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Grant Staff Access</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Styled Revoke Access Confirmation Modal */}
      <AdminModal
        isOpen={Boolean(memberToRevoke)}
        onClose={() => setMemberToRevoke(null)}
        maxWidth="md"
        icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
        title="Revoke Administrative Access"
        description={memberToRevoke ? `${memberToRevoke.name} (${memberToRevoke.email})` : ""}
        footer={
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setMemberToRevoke(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmRevoke}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Revoking...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Revoke Access</span>
                </>
              )}
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to revoke administrative privileges for{" "}
          <strong className="text-slate-900 font-semibold">{memberToRevoke?.name}</strong>{" "}
          (<span className="font-mono text-slate-700">{memberToRevoke?.email}</span>)?
          They will immediately lose access to the admin portal.
        </p>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(memberToSetPassword)}
        onClose={closeSetPasswordModal}
        maxWidth="md"
        icon={<KeyRound className="h-5 w-5 text-indigo-600" />}
        title="Set Staff Password"
        description={memberToSetPassword ? `${memberToSetPassword.name} (${memberToSetPassword.email})` : ""}
      >
        <form onSubmit={handleSetPassword} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Set a new password for this staff member. Their email will be confirmed so they can sign in
            without relying on the expired confirmation link.
          </p>
          <div>
            <label
              htmlFor="staff-password"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              New Password
            </label>
            <input
              id="staff-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={closeSetPasswordModal}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || newPassword.length < 6}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Set Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
