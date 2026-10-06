import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { enforceProductionEnvironmentCheck } from "./lib/production-guard";

// Run production environment validation at build time when in production
if (process.env.NODE_ENV === "production") {
  enforceProductionEnvironmentCheck();
}

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    dangerouslyAllowLocalIP: true,
    minimumCacheTTL: 31536000,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    qualities: [72, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rusllomzfhwhbyiakjvr.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  async redirects() {
    return [
      {
        source: "/products",
        destination: "/shop",
        permanent: true,
      },
    ];
  },
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
