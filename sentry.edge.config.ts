import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent, scrubBreadcrumb } from "./lib/sentry-scrubber";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isConfigured = Boolean(
  SENTRY_DSN &&
    !SENTRY_DSN.includes("your-public-key") &&
    !SENTRY_DSN.includes("placeholder")
);

Sentry.init({
  dsn: isConfigured ? SENTRY_DSN : undefined,
  enabled: isConfigured,
  environment: process.env.NODE_ENV || "development",
  // Performance tracing sample rate
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Explicit PII and sensitive payment scrubbing hooks
  beforeSend(event) {
    return scrubSentryEvent(event);
  },
  beforeBreadcrumb(breadcrumb) {
    return scrubBreadcrumb(breadcrumb);
  },
});
