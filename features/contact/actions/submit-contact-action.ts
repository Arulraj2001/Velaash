"use server";

import React from "react";
import { headers } from "next/headers";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { checkContactFormRateLimit } from "@/lib/rate-limit";
import { ContactInquiryEmail } from "../emails/contact-inquiry-email";
import {
  ContactFormSchema,
  type ContactFormData,
  type ContactActionResult,
} from "../types";

export async function submitContactFormAction(
  rawInput: ContactFormData | FormData
): Promise<ContactActionResult> {
  try {
    let rawObject: Record<string, unknown> = {};

    if (rawInput instanceof FormData) {
      rawObject = {
        name: rawInput.get("name"),
        email: rawInput.get("email"),
        subject: rawInput.get("subject"),
        message: rawInput.get("message"),
        company_website: rawInput.get("company_website"),
      };
    } else {
      rawObject = rawInput as Record<string, unknown>;
    }

    // 1. Honeypot Spam Protection
    // Bots routinely populate hidden inputs; humans do not.
    const honeypotVal = rawObject.company_website;
    if (typeof honeypotVal === "string" && honeypotVal.trim().length > 0) {
      console.info("[Contact:Honeypot] Bot submission intercepted and silently dropped.");
      // Return synthetic success so spammers don't adapt
      return {
        success: true,
        message:
          "Thank you for reaching out! We have received your inquiry and our team will get back to you shortly.",
      };
    }

    // 2. IP-based Abuse Throttling
    const headerList = await headers();
    const clientIp = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = await checkContactFormRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: rateCheck.errorMessage || "Too many messages sent. Please wait before submitting again.",
      };
    }

    // 3. Validate input schema
    const parsed = ContactFormSchema.safeParse(rawObject);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];
        if (fieldName && typeof fieldName === "string") {
          fieldErrors[fieldName] = issue.message;
        }
      }
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Please check your inputs and try again.",
        fieldErrors,
      };
    }

    const { name, email, subject, message } = parsed.data;

    // 4. Retrieve store contact email from site settings
    const siteSettings = await getSiteSettings();
    const storeEmail = siteSettings.storeProfile.email;

    // 5. Dispatch Email via Resend
    const emailResult = await sendTransactionalEmail({
      to: storeEmail,
      subject: `[Velaash Inquiry] ${subject} - ${name}`,
      react: React.createElement(ContactInquiryEmail, {
        name,
        email,
        subject,
        message,
        submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      }),
      text: `New customer inquiry received:\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    if (!emailResult.success) {
      console.warn("[Contact:Email] Failed to send email:", emailResult.error);
      return {
        success: false,
        error: "Unable to deliver your message right now. Please try again or reach out on WhatsApp.",
      };
    }

    return {
      success: true,
      message:
        "Thank you for reaching out! We have received your inquiry and our team will get back to you shortly.",
    };
  } catch (err: unknown) {
    console.error("[Contact:Action] Unexpected error processing contact inquiry:", err);
    return {
      success: false,
      error: "Something went wrong while submitting your message. Please try again or reach out on WhatsApp.",
    };
  }
}
