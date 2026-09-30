/**
 * Dynamic Sitemap — Next.js Native Sitemap API
 *
 * Queries live product and category data from Supabase on every ISR cycle
 * so the sitemap always reflects the current catalogue without a redeploy.
 *
 * EXCLUDED ROUTES (intentionally omitted — these also carry noindex tags):
 *   /cart, /checkout, /account/*, /admin/*, /order-confirmation/*, /api/*
 */

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

// Revalidate every 6 hours — newly added/removed products appear promptly
// without hammering the database on every crawler hit.
export const revalidate = 21600;

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");

/** Static pages always included in the sitemap */
const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/shop`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/faq`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    url: `${BASE_URL}/shipping-returns`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    url: `${BASE_URL}/size-guide`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/track-order`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/privacy-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    url: `${BASE_URL}/terms-conditions`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.2,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient();

    // Fetch active categories ordered by display position
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    // Fetch active products — newest first to give higher priority to fresh inventory
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const productUrls: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...STATIC_PAGES, ...categoryUrls, ...productUrls];
  } catch (err) {
    // If the database is unreachable (e.g. during build with no DB connection),
    // fall back to static pages only — never fail the build.
    console.error("[sitemap] Database query failed, returning static pages only:", err);
    return STATIC_PAGES;
  }
}
