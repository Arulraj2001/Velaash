"use client";

import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Automatically dispatch unhandled client exception to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FFFBF0] text-[#1A1A1A] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-2xl bg-white border border-[#E6D7C3] p-8 shadow-sm text-center space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE8E6] text-[#C5221F]">
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
            <h1 className="text-xl font-bold text-[#4D2A00]">
              Something unexpected occurred
            </h1>
            <p className="text-xs text-[#595959] leading-relaxed">
              We apologize for the interruption. Our technical team has been
              automatically notified of this error.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 rounded-xl bg-[#4D2A00] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#CC6F00] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="flex-1 rounded-xl border border-[#E6D7C3] bg-white px-4 py-2.5 text-xs font-semibold text-[#4D2A00] hover:bg-[#FFFBF0] transition-colors inline-flex items-center justify-center"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
