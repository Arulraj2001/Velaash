/**
 * ==============================================================================
 * Production Environment Safety Guard
 * ==============================================================================
 *
 * Verifies that production deployments do not accidentally run with placeholder,
 * test, or development credentials. Protects customer transactions, email
 * deliverability, and database integrity.
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates an environment map for production safety.
 * Can be called with process.env or a custom dictionary for automated testing.
 */
export function validateProductionEnvironment(
  targetEnv: Record<string, string | undefined> = process.env
): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeEnv = targetEnv.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  if (!isProduction) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // 1. Razorpay Payment Gateway Keys
  const rzpKey = targetEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const rzpSecret = targetEnv.RAZORPAY_KEY_SECRET?.trim();

  if (rzpKey) {
    if (rzpKey.startsWith("rzp_test_")) {
      errors.push(
        `CRITICAL: NEXT_PUBLIC_RAZORPAY_KEY_ID is a test key ('${rzpKey}'). Production deployment requires a live key starting with 'rzp_live_'. Live transactions will fail or not settle real funds!`
      );
    } else if (rzpKey.includes("placeholder") || rzpKey.includes("yourKeyId")) {
      errors.push(
        `CRITICAL: NEXT_PUBLIC_RAZORPAY_KEY_ID contains placeholder text ('${rzpKey}').`
      );
    }
  }

  if (rzpSecret) {
    if (rzpSecret.includes("placeholder") || rzpSecret.includes("your_razorpay")) {
      errors.push(
        `CRITICAL: RAZORPAY_KEY_SECRET contains placeholder text.`
      );
    }
  }

  // 2. Supabase Credentials
  const supabaseUrl = targetEnv.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = targetEnv.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || supabaseUrl.includes("your-project") || supabaseUrl.includes("localhost")) {
    errors.push(
      `CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing or points to a placeholder/localhost ('${supabaseUrl}').`
    );
  }

  if (!serviceKey || serviceKey.includes("your-service-role-key") || serviceKey.length < 20) {
    errors.push(
      `CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing or contains placeholder text. Server actions and webhooks cannot bypass RLS!`
    );
  }

  // 3. Resend Email Configuration
  const resendKey = targetEnv.RESEND_API_KEY?.trim();
  const emailFrom = targetEnv.EMAIL_FROM?.trim();

  if (!resendKey || resendKey.includes("your_resend") || resendKey.includes("placeholder")) {
    warnings.push(
      `WARNING: RESEND_API_KEY is not configured for production. Customer confirmation and receipt emails will be logged locally in mock mode.`
    );
  }

  if (emailFrom && emailFrom.includes("resend.dev")) {
    warnings.push(
      `WARNING: EMAIL_FROM uses sandbox domain ('${emailFrom}'). Resend will reject messages to real customer email domains unless a verified custom domain is configured.`
    );
  }

  // 4. Shiprocket Logistics
  const srEmail = targetEnv.SHIPROCKET_EMAIL?.trim();
  if (!srEmail || srEmail.includes("example.com") || srEmail.includes("placeholder")) {
    warnings.push(
      `WARNING: SHIPROCKET_EMAIL is not configured or uses example.com. Live carrier rate calculation and automated AWB generation will operate in mock fallback mode.`
    );
  }

  // 5. Canonical App URL
  const appUrl = targetEnv.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl || appUrl.includes("localhost")) {
    warnings.push(
      `WARNING: NEXT_PUBLIC_APP_URL is set to '${appUrl}'. SEO canonical tags, sitemap entries, and OpenGraph URLs should use the production custom domain.`
    );
  }

  // 6. Upstash Redis
  const upstashUrl = targetEnv.UPSTASH_REDIS_REST_URL?.trim();
  if (!upstashUrl || upstashUrl.includes("your-upstash")) {
    warnings.push(
      `NOTICE: UPSTASH_REDIS_REST_URL is unset. Rate limiting will use in-memory sliding windows (adequate for single instance, distributed recommended for multiple edge functions).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Enforces production environment safety. Throws a fatal Error if critical
 * configuration errors are detected under NODE_ENV=production.
 */
export function enforceProductionEnvironmentCheck(): void {
  const allowTestKeys =
    process.env.ALLOW_TEST_KEYS === "true" || process.env.SKIP_ENV_VALIDATION === "true";
  const { isValid, errors, warnings } = validateProductionEnvironment();

  if (warnings.length > 0) {
    console.warn("\n========================================================");
    console.warn("⚠️  PRODUCTION ENVIRONMENT WARNINGS:");
    warnings.forEach((w) => console.warn(`   • ${w}`));
    console.warn("========================================================\n");
  }

  if (!isValid) {
    if (allowTestKeys) {
      console.warn("\n========================================================");
      console.warn("⚠️  PRODUCTION ENVIRONMENT CHECKS BYPASSED (ALLOW_TEST_KEYS=true):");
      errors.forEach((e) => console.warn(`   ! ${e}`));
      console.warn("========================================================\n");
      return;
    }

    console.error("\n========================================================");
    console.error("🛑 FATAL: PRODUCTION ENVIRONMENT CONFIGURATION ERRORS:");
    errors.forEach((e) => console.error(`   ✗ ${e}`));
    console.error("========================================================");
    console.error("Build aborted to protect financial and customer security.\n");
    throw new Error(`Production environment check failed: ${errors[0]}`);
  }
}
