import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Dev-Only Sentry Verification Endpoint
 *
 * GET /api/dev/sentry-test
 * - In production: returns HTTP 404 Not Found (blocked)
 * - In development: emits a test Sentry exception and breadcrumb to verify pipeline
 */
export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    Sentry.addBreadcrumb({
      category: "test",
      message: "Testing Sentry breadcrumb recording",
      level: "info",
    });

    const testError = new Error("Velaash Sentry Test Exception: Pipeline Verified");
    const eventId = Sentry.captureException(testError, {
      tags: {
        source: "sentry_test_route",
        test_run: true,
      },
      extra: {
        timestamp: new Date().toISOString(),
        node_env: process.env.NODE_ENV,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sentry test event successfully captured",
      eventId,
      environment: process.env.NODE_ENV,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
