/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * ==============================================================================
 * Production Readiness & Deployment Safety Test Suite
 * ==============================================================================
 *
 * Verifies:
 * 1. Production Credential Check:
 *    - Fails/warns when test or placeholder keys (e.g., rzp_test_, dummy Supabase)
 *      are detected under NODE_ENV=production.
 *    - Passes cleanly under development/test or when real live credentials are supplied.
 *    - Verifies script execution guard blocks destructive scripts in production without
 *      explicit confirmation flags.
 * 2. Sentry PII & Sensitive Data Scrubbing:
 *    - Explicitly tests scrubber with a realistic error event payload containing:
 *      customer address, phone number, Razorpay signature, payment ID, auth headers.
 *    - Asserts that all sensitive keys, 10-digit Indian phone numbers, 64-char HMAC
 *      hashes, and tokens are redacted.
 * 3. Environment Variable Parity Check:
 *    - Audits .env.example against lib/env.ts schema to guarantee 100% 1-to-1 parity
 *      (0 missing, 0 extra).
 *
 * Run with: npx tsx scratch/test-production-readiness.ts
 */

import * as fs from "fs";
import * as path from "path";
import { validateProductionEnvironment } from "../lib/production-guard";
import { scrubSentryEvent, scrubBreadcrumb, scrubString } from "../lib/sentry-scrubber";
import { assertSafeScriptExecution } from "../lib/script-guard";
import type { ErrorEvent, Breadcrumb } from "@sentry/nextjs";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) {
      console.error(`     Details: ${failureDetails}`);
    }
  }
}

async function runTestSuite() {
  console.log("\n================================================================================");
  console.log("🚀 VELAASH PRODUCTION READINESS & NETLIFY DEPLOYMENT TEST SUITE");
  console.log("================================================================================\n");

  // ==============================================================================
  // SUITE 1: PRODUCTION CREDENTIAL SAFETY CHECK
  // ==============================================================================
  console.log("📦 [SUITE 1] Production Credential & Environment Safety Guards");

  // Test 1.1: rzp_test_ key in production must fail validation
  const testEnvRzpTest = {
    NODE_ENV: "production",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_1234567890abcdef",
    RAZORPAY_KEY_SECRET: "live_secret_sample_key_123456",
    NEXT_PUBLIC_SUPABASE_URL: "https://abcxyz.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-service-key-length-check",
  };
  const result1 = validateProductionEnvironment(testEnvRzpTest);
  assert(
    !result1.isValid && result1.errors.some((e) => e.includes("rzp_test_")),
    "Rejects Razorpay test key (rzp_test_) when NODE_ENV=production",
    JSON.stringify(result1.errors)
  );

  // Test 1.2: Placeholder Razorpay key in production must fail validation
  const testEnvPlaceholderRzp = {
    NODE_ENV: "production",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_yourKeyId",
    RAZORPAY_KEY_SECRET: "your_razorpay_key_secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://abcxyz.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-service-key-length-check",
  };
  const result2 = validateProductionEnvironment(testEnvPlaceholderRzp);
  assert(
    !result2.isValid && result2.errors.some((e) => e.includes("placeholder")),
    "Rejects placeholder Razorpay keys in production",
    JSON.stringify(result2.errors)
  );

  // Test 1.3: Placeholder Supabase credentials in production must fail validation
  const testEnvPlaceholderSupabase = {
    NODE_ENV: "production",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_realLiveKey12345",
    RAZORPAY_KEY_SECRET: "real_secret_key_production_1234",
    NEXT_PUBLIC_SUPABASE_URL: "https://your-project-ref.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key-never-expose",
  };
  const result3 = validateProductionEnvironment(testEnvPlaceholderSupabase);
  assert(
    !result3.isValid &&
      result3.errors.some((e) => e.includes("NEXT_PUBLIC_SUPABASE_URL")) &&
      result3.errors.some((e) => e.includes("SUPABASE_SERVICE_ROLE_KEY")),
    "Rejects placeholder Supabase URL and service role key in production",
    JSON.stringify(result3.errors)
  );

  // Test 1.4: Valid live credentials in production must pass validation
  const validProductionEnv = {
    NODE_ENV: "production",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_abc123RealProductionKey",
    RAZORPAY_KEY_SECRET: "real_production_secret_9876543210",
    NEXT_PUBLIC_SUPABASE_URL: "https://realproduction.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real-production-service-role-key-32chars",
    NEXT_PUBLIC_APP_URL: "https://velaash.in",
    RESEND_API_KEY: "re_real_resend_live_api_key_123",
    EMAIL_FROM: "Velaash <orders@velaash.in>",
    SHIPROCKET_EMAIL: "operations@velaash.in",
    SHIPROCKET_PASSWORD: "secure_real_password_123",
  };
  const result4 = validateProductionEnvironment(validProductionEnv);
  assert(
    result4.isValid && result4.errors.length === 0,
    "Accepts valid live production credentials with 0 errors",
    `Errors: ${JSON.stringify(result4.errors)}`
  );

  // Test 1.5: Non-production environments allow test keys without errors
  const devEnv = {
    NODE_ENV: "development",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_yourKeyId",
    RAZORPAY_KEY_SECRET: "your_razorpay_key_secret",
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_ROLE_KEY: "short_dummy_key",
  };
  const result5 = validateProductionEnvironment(devEnv);
  assert(
    result5.isValid && result5.errors.length === 0,
    "Allows test and placeholder credentials cleanly when NODE_ENV=development",
    `Errors: ${JSON.stringify(result5.errors)}`
  );

  // Test 1.6: Script execution guard blocks unconfirmed execution in production
  const originalNodeEnv = process.env.NODE_ENV;
  const originalArgv = [...process.argv];
  const originalAllow = process.env.ALLOW_PRODUCTION_SCRIPTS;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.ALLOW_PRODUCTION_SCRIPTS;
    process.argv = ["node", "scratch/execute-seed.ts"];

    let threwError = false;
    try {
      assertSafeScriptExecution("scratch/execute-seed.ts");
    } catch {
      threwError = true;
    }
    assert(
      threwError,
      "Script guard blocks seed script under NODE_ENV=production without confirmation flag"
    );

    // Test with --confirm-production flag
    process.argv.push("--confirm-production");
    let passedWithFlag = false;
    try {
      assertSafeScriptExecution("scratch/execute-seed.ts");
      passedWithFlag = true;
    } catch {
      passedWithFlag = false;
    }
    assert(
      passedWithFlag,
      "Script guard allows execution when --confirm-production flag is explicitly passed"
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    process.argv = originalArgv;
    if (originalAllow) process.env.ALLOW_PRODUCTION_SCRIPTS = originalAllow;
  }

  console.log();

  // ==============================================================================
  // SUITE 2: SENTRY SENSITIVE DATA & PII SCRUBBING
  // ==============================================================================
  console.log("🔒 [SUITE 2] Sentry PII & Sensitive Data Scrubbing");

  // Test 2.1: Regex string scrubbers
  const phoneSample = "Customer called from +91 9876543210 about order failure.";
  const scrubbedPhone = scrubString(phoneSample);
  assert(
    !scrubbedPhone.includes("9876543210") && scrubbedPhone.includes("[REDACTED_PHONE]"),
    "String scrubber redacts Indian phone numbers (+91 9876543210 -> [REDACTED_PHONE])",
    scrubbedPhone
  );

  const signatureSample =
    "Webhook verification failed for sig: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const scrubbedSig = scrubString(signatureSample);
  assert(
    !scrubbedSig.includes("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") &&
      scrubbedSig.includes("[REDACTED_SIGNATURE]"),
    "String scrubber redacts 64-char HMAC-SHA256 hex signatures",
    scrubbedSig
  );

  // Test 2.2: Deep scrubbing of full Sentry ErrorEvent payload
  const rawEvent = {
    event_id: "test-event-123456",
    timestamp: Date.now() / 1000,
    level: "error",
    message: "Payment processing failed for customer 9876543210 with signature 4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123",
    user: {
      id: "cust-uuid-1111",
      email: "priya.sharma@example.com",
      username: "Priya Sharma",
      ip_address: "103.21.124.5",
      phone: "+91 9876543210",
      address: "124 Marine Drive, Nariman Point, Mumbai 400021",
    } as any,
    request: {
      url: "https://velaash.in/api/checkout/verify",
      method: "POST",
      headers: {
        authorization: "Bearer secret-super-token-12345",
        cookie: "sb-auth-token=secret_cookie_token_abc; session=xyz",
        "x-razorpay-signature": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        "content-type": "application/json",
      },
      cookies: {
        session_token: "sensitive_cookie_string",
      },
      data: {
        order_id: "order_xyz123",
        razorpay_payment_id: "pay_Live123456789",
        razorpay_signature: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        shipping_address: {
          address_line1: "Flat 402, Lotus Residency, MG Road",
          city: "Bengaluru",
          pincode: "560001",
          state: "Karnataka",
          phone: "9876543210",
        },
        card_number: "4111111111111111",
        cvv: "123",
      },
    },
    extra: {
      customerNote: "Please call on 9123456789 before delivery to 560001",
      shipping_address: "42 Park Street, Kolkata",
      webhook_secret: "whsec_super_secret_webhook_key",
    },
    breadcrumbs: [
      {
        category: "ui.click",
        message: "User clicked Pay Now with phone 9876543210",
        data: {
          phone_number: "9876543210",
          billing_address: "42 Park Street, Kolkata 700016",
        },
      },
    ],
  };

  const scrubbedEvent = scrubSentryEvent(rawEvent as unknown as ErrorEvent);
  assert(scrubbedEvent !== null, "Scrubber successfully processed Sentry ErrorEvent");

  if (scrubbedEvent) {
    // Check user redaction
    assert(
      scrubbedEvent.user?.email === "[SCRUBBED_EMAIL]",
      "User email is redacted to [SCRUBBED_EMAIL]"
    );
    assert(
      scrubbedEvent.user?.username === "[SCRUBBED_NAME]",
      "User username is redacted to [SCRUBBED_NAME]"
    );
    assert(
      scrubbedEvent.user?.ip_address === "[SCRUBBED_IP]",
      "User IP address is redacted to [SCRUBBED_IP]"
    );
    assert(
      (scrubbedEvent.user as any)?.phone === undefined,
      "User phone property is completely removed"
    );
    assert(
      (scrubbedEvent.user as any)?.address === undefined,
      "User address property is completely removed"
    );

    // Check request header redaction
    assert(
      scrubbedEvent.request?.headers?.["authorization"] === "[REDACTED]",
      "Request authorization header is replaced with [REDACTED]"
    );
    assert(
      scrubbedEvent.request?.headers?.["cookie"] === "[REDACTED]",
      "Request cookie header is replaced with [REDACTED]"
    );
    assert(
      scrubbedEvent.request?.headers?.["x-razorpay-signature"] === "[REDACTED]",
      "x-razorpay-signature header is replaced with [REDACTED]"
    );
    assert(
      scrubbedEvent.request?.cookies?.["session_token"] === "[REDACTED]",
      "Request cookies field is replaced with [REDACTED]"
    );

    // Check request data payload redaction
    const reqData = scrubbedEvent.request?.data as any;
    assert(
      reqData?.shipping_address === "[REDACTED]",
      "Request body shipping_address is replaced with [REDACTED]"
    );
    assert(
      reqData?.razorpay_payment_id === "[REDACTED]",
      "Request body razorpay_payment_id is replaced with [REDACTED]"
    );
    assert(
      reqData?.razorpay_signature === "[REDACTED]",
      "Request body razorpay_signature is replaced with [REDACTED]"
    );
    assert(
      reqData?.card_number === "[REDACTED]",
      "Request body card_number is replaced with [REDACTED]"
    );
    assert(
      reqData?.cvv === "[REDACTED]",
      "Request body cvv is replaced with [REDACTED]"
    );

    // Check extra context redaction
    const extra = scrubbedEvent.extra as any;
    assert(
      extra?.shipping_address === "[REDACTED]",
      "Extra context shipping_address is replaced with [REDACTED]"
    );
    assert(
      extra?.webhook_secret === "[REDACTED]",
      "Extra context webhook_secret is replaced with [REDACTED]"
    );
    assert(
      Boolean(!extra?.customerNote?.includes("9123456789") && extra?.customerNote?.includes("[REDACTED_PHONE]")),
      "Extra context inline phone number string is scrubbed"
    );

    // Check event message redaction
    assert(
      Boolean(!scrubbedEvent.message?.includes("9876543210") &&
        scrubbedEvent.message?.includes("[REDACTED_PHONE]")),
      "Event message inline phone number is scrubbed"
    );
    assert(
      Boolean(!scrubbedEvent.message?.includes("4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123") &&
        scrubbedEvent.message?.includes("[REDACTED_SIGNATURE]")),
      "Event message 64-char signature hash is scrubbed"
    );

    // Check breadcrumb redaction
    const crumb = scrubbedEvent.breadcrumbs?.[0];
    assert(
      Boolean(!crumb?.message?.includes("9876543210") && crumb?.message?.includes("[REDACTED_PHONE]")),
      "Breadcrumb message phone number is scrubbed"
    );
    assert(
      crumb?.data?.phone_number === "[REDACTED]",
      "Breadcrumb data phone_number is replaced with [REDACTED]"
    );
    assert(
      crumb?.data?.billing_address === "[REDACTED]",
      "Breadcrumb data billing_address is replaced with [REDACTED]"
    );
  }

  console.log();

  // ==============================================================================
  // SUITE 3: ENVIRONMENT VARIABLE PARITY & AUDIT (.env.example vs lib/env.ts)
  // ==============================================================================
  console.log("📋 [SUITE 3] Environment Variable Audit & Parity (.env.example vs lib/env.ts)");

  const rootDir = path.resolve(__dirname, "..");
  const envExamplePath = path.join(rootDir, ".env.example");
  const envTsPath = path.join(rootDir, "lib", "env.ts");

  assert(fs.existsSync(envExamplePath), ".env.example exists on disk");
  assert(fs.existsSync(envTsPath), "lib/env.ts exists on disk");

  const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");
  const envTsContent = fs.readFileSync(envTsPath, "utf-8");

  // Extract all keys defined in .env.example (lines like KEY=value)
  const envExampleKeys = new Set<string>();
  const envExampleLines = envExampleContent.split("\n");
  for (const line of envExampleLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([A-Z0-9_]+)=/);
      if (match) {
        envExampleKeys.add(match[1]);
      }
    }
  }

  // Extract all keys validated in lib/env.ts server and client blocks
  // Regex looks for keys in server: { ... } and client: { ... }
  const envTsKeys = new Set<string>();
  const serverBlockMatch = envTsContent.match(/server:\s*\{([\s\S]*?)\},\s*client:/);
  const clientBlockMatch = envTsContent.match(/client:\s*\{([\s\S]*?)\},\s*runtimeEnv:/);

  if (serverBlockMatch) {
    const lines = serverBlockMatch[1].split("\n");
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed && !trimmed.startsWith("//")) {
        const keyMatch = trimmed.match(/^([A-Z0-9_]+):/);
        if (keyMatch) {
          envTsKeys.add(keyMatch[1]);
        }
      }
    }
  }

  if (clientBlockMatch) {
    const lines = clientBlockMatch[1].split("\n");
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed && !trimmed.startsWith("//")) {
        const keyMatch = trimmed.match(/^([A-Z0-9_]+):/);
        if (keyMatch) {
          envTsKeys.add(keyMatch[1]);
        }
      }
    }
  }

  console.log(`   Found ${envExampleKeys.size} variables in .env.example`);
  console.log(`   Found ${envTsKeys.size} variables in lib/env.ts`);

  // Check for variables in env.ts missing from .env.example
  const missingInExample = [...envTsKeys].filter((k) => !envExampleKeys.has(k));
  assert(
    missingInExample.length === 0,
    "No variables validated in lib/env.ts are missing from .env.example",
    `Missing in .env.example: ${missingInExample.join(", ")}`
  );

  // Check for variables in .env.example missing from env.ts
  const extraInExample = [...envExampleKeys].filter((k) => !envTsKeys.has(k));
  assert(
    extraInExample.length === 0,
    "No variables defined in .env.example are missing from lib/env.ts validation",
    `Extra in .env.example: ${extraInExample.join(", ")}`
  );

  // Confirm exact matching count
  assert(
    envExampleKeys.size === envTsKeys.size && missingInExample.length === 0 && extraInExample.length === 0,
    `Exact 1-to-1 match: All ${envExampleKeys.size} environment variables are synchronized across .env.example and lib/env.ts`
  );

  console.log("\n================================================================================");
  console.log(`📊 TEST RESULTS: ${passedTests} passed, ${failedTests} failed, ${totalTests} total`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
