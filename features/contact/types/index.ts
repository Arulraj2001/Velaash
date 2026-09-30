import { z } from "zod";

export const ContactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters long")
    .max(150, "Subject cannot exceed 150 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters long")
    .max(3000, "Message cannot exceed 3000 characters"),
  // Invisible honeypot field for bot deterrence
  company_website: z.string().optional(),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

export interface ContactActionResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}
