import { z } from "zod";
import type { AdminRole } from "@/types/database.types";

export const SendOtpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export const VerifyOtpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  token: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain digits only"),
  fullName: z.string().trim().optional(),
});

export const AdminLoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid admin email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const CustomerProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
export type CustomerProfileUpdateInput = z.infer<typeof CustomerProfileUpdateSchema>;

export interface AuthActionResult<T = void> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  requiresName?: boolean;
}

export interface AdminUserSession {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

import type { AdminPermissionKey } from "@/features/admin/permissions";

export type AdminPermission = AdminPermissionKey;
