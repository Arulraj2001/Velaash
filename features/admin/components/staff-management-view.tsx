"use client";

import React, { useState, useTransition, useActionState } from "react";
import type { AdminUserSession } from "@/features/auth/types";
import type { AdminUserListItem } from "../types";
import type { AdminRole } from "@/types/database.types";
import {
  addStaffMemberAction,
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
} from "lucide-react";

interface StaffManagementViewProps {
  currentAdmin: AdminUserSession;
  staffMembers: AdminUserListItem[];
}

export function StaffManagementView({
  currentAdmin,
  staffMembers,
}: StaffManagementViewProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form action for adding staff
  const [, formAction, isFormPending] = useActionState(

    async (prev: unknown, formData: FormData) => {
      setFeedback(null);
      const res = await addStaffMemberAction(prev, formData);
      if (res.success && res.message) {
        setFeedback({ type: "success", message: res.message });
      } else if (!res.success && res.error) {
        setFeedback({ type: "error", message: res.error });
      }
      return res;
    },
    null
  );

  const handleRoleChange = (userId: string, newRole: AdminRole) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateStaffRoleAction(userId, newRole);
      if (res.success && res.message) {
        setFeedback({ type: "success", message: res.message });
      } else if (!res.success && res.error) {
        setFeedback({ type: "error", message: res.error });
      }
    });
  };

  const handleRemove = (userId: string, email: string) => {
    if (!window.confirm(`Revoke administrative access for ${email}?`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await removeStaffMemberAction(userId);
      if (res.success && res.message) {
        setFeedback({ type: "success", message: res.message });
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
          className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{feedback.message}</span>
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

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{member.fullName}</span>
                              {isCurrent && (
                                <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-700">
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
                            {/* Role Toggle Selector */}
                            <select
                              disabled={isPending}
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value as AdminRole)
                              }
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-indigo-500"
                            >
                              <option value="staff">Staff</option>
                              <option value="owner">Owner</option>
                            </select>

                            {/* Revoke Access Button */}
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleRemove(member.id, member.email)}
                              title="Revoke access"
                              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
              Staff members create their credentials in Supabase first. Enter their registered
              email address below to grant them operational dashboard access with role{" "}
              <strong className="text-slate-700">staff</strong>.
            </p>

            <form action={formAction} className="space-y-3">
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
    </div>
  );
}
