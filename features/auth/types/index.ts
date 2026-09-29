import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.enum(["customer", "admin"]).default("customer"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
