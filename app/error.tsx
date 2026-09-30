"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-white border border-brand-border p-8 text-center space-y-5 shadow-xs">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-heading text-brand-dark">
            Something went wrong
          </h2>
          <p className="text-xs text-brand-muted leading-relaxed">
            We encountered an unexpected error while loading this page. Our team has been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-brand-dark px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-accent transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-xs font-semibold text-brand-dark hover:bg-brand-light transition-colors inline-flex items-center justify-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
