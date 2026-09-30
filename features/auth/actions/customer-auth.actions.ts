"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  SendOtpSchema,
  VerifyOtpSchema,
  CustomerProfileUpdateSchema,
  type AuthActionResult,
  type SendOtpInput,
  type VerifyOtpInput,
} from "../types";

/**
 * Maps Supabase Auth errors to user-friendly messages
 */
function mapAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("over_email_send_rate_limit")
  ) {
    return "Too many requests sent. For your security, please wait 60 seconds before requesting another code.";
  }
  if (
    msg.includes("invalid") ||
    msg.includes("token has expired") ||
    msg.includes("otp_expired") ||
    msg.includes("token is invalid")
  ) {
    return "The verification code is invalid or has expired. Please check the digits or request a fresh code.";
  }
  if (msg.includes("network") || msg.includes("fetch failed")) {
    return "Unable to reach authentication services. Please check your connection and try again.";
  }
  return "Authentication could not be completed. Please verify your details and try again.";
}

/**
 * Sends a 6-digit OTP code to the customer's email.
 */
export async function sendOtpAction(input: SendOtpInput): Promise<AuthActionResult> {
  const parsed = SendOtpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email address format.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${parsed.data.email}.`,
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Verifies the customer's 6-digit OTP code and ensures customer profile exists.
 */
export async function verifyOtpAction(input: VerifyOtpInput): Promise<AuthActionResult> {
  const parsed = VerifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please provide a valid code.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: "email",
    });

    if (error || !user) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    // Ensure customer row exists and check if customer has a valid name
    const { data: customer } = await supabase
      .from("customers")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!customer) {
      await supabase.from("customers").insert({
        id: user.id,
        full_name: parsed.data.fullName || "Valued Customer",
        phone: null,
      });
    } else if (parsed.data.fullName && customer.full_name === "Valued Customer") {
      await supabase
        .from("customers")
        .update({ full_name: parsed.data.fullName })
        .eq("id", user.id);
    }

    revalidatePath("/", "layout");

    const requiresName =
      !customer || customer.full_name === "Valued Customer" || !customer.full_name?.trim();

    return {
      success: true,
      message: "Authentication successful.",
      requiresName,
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Initiates Google OAuth sign-in flow.
 */
export async function signInWithGoogleAction(
  returnUrl = "/account"
): Promise<AuthActionResult<{ url: string }>> {
  try {
    const headerList = await headers();
    const host = headerList.get("host") || "velaash.in";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = env.NEXT_PUBLIC_APP_URL
      ? env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : `${protocol}://${host}`;
    const redirectTo = `${origin}/account/auth/callback?returnUrl=${encodeURIComponent(
      returnUrl
    )}`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !data.url) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      data: { url: data.url },
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Updates customer profile details (full name, phone).
 */
export async function updateCustomerProfileAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  };

  const parsed = CustomerProfileUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile information.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be signed in to update your profile.",
      };
    }

    const { error } = await supabase.from("customers").upsert({
      id: user.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
    });

    if (error) {
      return {
        success: false,
        error: "Failed to update profile. Please try again.",
      };
    }

    revalidatePath("/account", "layout");
    return {
      success: true,
      message: "Your profile has been saved successfully.",
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Signs the customer out of the application.
 */
export async function signOutCustomerAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/account/login");
}
