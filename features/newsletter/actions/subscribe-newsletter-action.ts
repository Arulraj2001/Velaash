"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { persistNewsletterSubscription } from "../services/subscribe-newsletter";

const NewsletterEmailSchema = z.string().trim().email().max(254);

export async function subscribeNewsletterAction(rawEmail: string) {
  const parsedEmail = NewsletterEmailSchema.safeParse(rawEmail);
  if (!parsedEmail.success) {
    return { success: false as const, error: "Please enter a valid email address." };
  }

  try {
    const supabase = await createClient();
    return await persistNewsletterSubscription(supabase, parsedEmail.data);
  } catch (error) {
    console.error("Newsletter subscription action failed:", error);
    return {
      success: false as const,
      error: "We could not save your subscription right now. Please try again shortly.",
    };
  }
}