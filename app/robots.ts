/**
 * Robots.txt — Next.js Native Robots API
 *
 * Defense-in-depth SEO protection:
 *   1. robots.txt disallows sensitive routes here (crawler layer)
 *   2. noindex meta tags on those same pages (HTML layer)
 *   Both layers are intentionally kept — removing either one would reduce protection.
 *
 * Disallowed paths:
 *   /cart             — transient state, no SEO value
 *   /checkout         — private, session-dependent
 *   /account/*        — authenticated user pages
 *   /admin/*          — internal admin panel (also has noindex meta tags)
 *   /api/*            — API endpoints, not indexable content
 *   /order-confirmation/* — private post-purchase pages (also have noindex)
 */

import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/account/",
          "/admin/",
          "/api/",
          "/order-confirmation/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
