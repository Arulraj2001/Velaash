import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { enforceProductionEnvironmentCheck } from "./lib/production-guard";

// Run production environment validation at build time when in production
if (process.env.NODE_ENV === "production") {
  enforceProductionEnvironmentCheck();
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "velaash",
  project: process.env.SENTRY_PROJECT || "velaash-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
});
