import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";
import React from "react";

// In-memory test/audit log of dispatched emails for terminal testing and local diagnostics
export interface DispatchedEmailRecord {
  to: string;
  subject: string;
  timestamp: number;
  reactComponent?: React.ReactElement;
  text?: string;
  orderNumber?: string;
}

export const DISPATCHED_EMAILS_LOG: DispatchedEmailRecord[] = [];

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (apiKey && apiKey.startsWith("re_")) {
    resendInstance = new Resend(apiKey);
    return resendInstance;
  }
  return null;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  text?: string;
  orderNumber?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  mocked?: boolean;
  error?: string;
}

/**
 * Dispatches transactional email via Resend with graceful fallback and non-blocking failure semantics.
 * CRITICAL RULE: Email dispatch failures MUST NEVER break or abort order creation or payment flows.
 */
export async function sendTransactionalEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const from = env.EMAIL_FROM || "Velaash <orders@velaash.in>";

  // Record into audit log
  DISPATCHED_EMAILS_LOG.push({
    to: options.to,
    subject: options.subject,
    timestamp: Date.now(),
    reactComponent: options.react,
    text: options.text,
    orderNumber: options.orderNumber,
  });

  const resend = getResendClient();

  // In development/test environments, mock dispatch to RFC 2606 reserved test domains
  // because Resend sandbox API strictly rejects domains like example.com
  const isTestDomain =
    /@(example\.(com|org|net)|.*\.test|.*\.example)$/i.test(options.to) ||
    options.to.endsWith("@example-velaash.in");

  if (!resend || isTestDomain) {
    console.info(
      `[Email:Mock] ${isTestDomain ? "Test domain detected" : "RESEND_API_KEY not configured"}. Simulated dispatch to "${options.to}" with subject: "${options.subject}"`
    );
    return {
      success: true,
      id: `mock-email-${Date.now()}`,
      mocked: true,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      react: options.react,
      text: options.text,
    });

    if (error) {
      console.error(
        `[Email:Error] Resend API rejected message to "${options.to}" for order "${options.orderNumber}":`,
        error
      );
      Sentry.captureMessage(
        `[Email:Warning] Resend failed to dispatch email for order ${options.orderNumber || "N/A"}: ${error.message}`,
        {
          level: "warning",
          tags: { service: "email", orderNumber: options.orderNumber },
        }
      );
      return {
        success: false,
        error: error.message,
      };
    }

    console.info(
      `[Email:Success] Resend dispatched message id: ${data?.id} to "${options.to}" for order "${options.orderNumber}"`
    );

    return {
      success: true,
      id: data?.id,
      mocked: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[Email:Exception] Network or unexpected exception while sending email to "${options.to}":`,
      msg
    );
    Sentry.captureException(err, {
      level: "warning",
      tags: { service: "email", orderNumber: options.orderNumber },
    });
    return {
      success: false,
      error: msg,
    };
  }
}
