"use server";

import * as React from "react";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { CustomerOtpEmail } from "../emails/customer-otp-email";
import { getSiteSettings } from "@/features/settings";
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
 * Generates an OTP verification code and dispatches a branded email via Resend.
 * Uses elevated service role client to generate the OTP token without triggering
 * Supabase's built-in default email template (which omits the OTP token code).
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
    const email = parsed.data.email.toLowerCase();

    // Determine return / redirect URL for fallback 1-click button
    const headerList = await headers();
    const host = headerList.get("host") || "velaash.in";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = env.NEXT_PUBLIC_APP_URL
      ? env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : `${protocol}://${host}`;
    const redirectTo = `${origin}/account/auth/callback?returnUrl=/account`;

    // Security Justification: The elevated service-role admin client is strictly required
    // here to invoke `admin.generateLink({ type: "magiclink" })`. This generates the raw OTP
    // verification token without triggering Supabase's built-in mailer pool (which sends generic
    // magic links without OTP codes). It also securely provisions new customer auth accounts.
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    });

    if (error || !data?.properties?.email_otp) {
      return {
        success: false,
        error: mapAuthError(error || new Error("Failed to generate verification code")),
      };
    }

    const otpCode = data.properties.email_otp;
    const magicLinkUrl = data.properties.action_link;

    // Fetch site settings for concierge contact info
    let supportEmail = "care@velaash.in";
    try {
      const { storeProfile } = await getSiteSettings();
      if (storeProfile?.email) {
        supportEmail = storeProfile.email;
      }
    } catch {
      // Non-blocking fallback to default
    }

    // Dispatch branded transactional email via Resend
    const emailResult = await sendTransactionalEmail({
      to: email,
      subject: `${otpCode} is your Velaash verification code`,
      react: React.createElement(CustomerOtpEmail, {
        otpCode,
        magicLinkUrl,
        supportEmail,
      }),
      text: `Your Velaash verification code is: ${otpCode}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: "Failed to dispatch verification email. Please check your address or try again shortly.",
      };
    }

    return {
      success: true,
      message: `A verification code has been sent to ${email}.`,
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Verifies the customer's OTP code and ensures customer profile exists.
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
      email: parsed.data.email.toLowerCase(),
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
