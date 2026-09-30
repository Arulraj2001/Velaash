/**
 * Google Merchant Center Product Feed
 * Endpoint: GET /api/feed/google-merchant
 *
 * Format: RSS 2.0 with Google Shopping (g:) namespace
 * https://support.google.com/merchants/answer/7052112
 *
 * REQUIRED SETUP (client action — cannot be automated):
 * -------------------------------------------------------
 * Once the client has a Google Merchant Center account set up:
 *   1. Go to Merchant Center → Products → Feeds
 *   2. Click "+" to add a new feed
 *   3. Choose "Scheduled fetch" as the input method
 *   4. Enter the feed URL: https://velaash.in/api/feed/google-merchant
 *   5. Set fetch frequency to "Daily" (the feed is revalidated every 6 hours via ISR)
 *   6. Complete the currency and country targeting setup (India / INR)
 *
 * NOTE: This feed is publicly accessible (no auth) because Google Merchant Center
 * must be able to fetch it on a schedule without credentials. The data it exposes
 * (product name, price, image, availability) is already visible on the storefront.
 *
 * Google Product Categories for clothing:
 *   2271 = Apparel & Accessories > Clothing
 *   5697 = Apparel & Accessories > Clothing > Dresses
 *   5697 = Apparel & Accessories > Clothing > Tops
 *   5701 = Apparel & Accessories > Clothing > Pants
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

// Revalidate every 6 hours — keeps price/stock data fresh without hammering DB
export const revalidate = 21600;

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");
const BRAND_NAME = "Velaash";

/** Map category slugs to Google Product Category IDs */
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  "kurtas-sets": "Apparel & Accessories > Clothing",
  dresses: "Apparel & Accessories > Clothing > Dresses",
  "co-ord-sets": "Apparel & Accessories > Clothing",
  "tops-shirts": "Apparel & Accessories > Clothing > Tops",
  bottoms: "Apparel & Accessories > Clothing > Pants",
  loungewear: "Apparel & Accessories > Clothing",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface FeedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  stock_status: string;
  updated_at: string;
  category_slug: string | null;
  primary_image: string | null;
  // Variant-level stock
  total_stock: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Query active products with their primary image and category slug
    const { data: rawProducts, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        description,
        base_price,
        stock_status,
        updated_at,
        categories ( slug ),
        product_images ( image_url, is_primary, display_order ),
        product_variants ( stock_quantity, is_active )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[google-merchant feed] DB error:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    const products: FeedProduct[] = (rawProducts ?? []).map((p) => {
      const categoryData = Array.isArray(p.categories) ? p.categories[0] : p.categories;
      const images = (p.product_images ?? []).sort(
        (a: { is_primary: boolean; display_order: number }, b: { is_primary: boolean; display_order: number }) =>
          (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order
      );
      const primaryImage = images[0]?.image_url ?? null;
      const activeVariants = (p.product_variants ?? []).filter(
        (v: { is_active: boolean }) => v.is_active
      );
      const totalStock = activeVariants.reduce(
        (sum: number, v: { stock_quantity: number | null }) => sum + (v.stock_quantity ?? 0),
        0
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        base_price: Number(p.base_price),
        stock_status: p.stock_status,
        updated_at: p.updated_at,
        category_slug: categoryData?.slug ?? null,
        primary_image: primaryImage,
        total_stock: totalStock,
      };
    });

    const feedItems = products
      .map((p) => {
        const productUrl = `${BASE_URL}/products/${escapeXml(p.slug)}`;
        const imageUrl = p.primary_image ? escapeXml(p.primary_image) : "";
        // Use real total_stock to determine availability (more accurate than stock_status field)
        const inStock = p.total_stock > 0 && p.stock_status !== "out_of_stock";
        const availability = inStock ? "in stock" : "out of stock";
        const price = p.base_price.toFixed(2);
        const googleCategory =
          (p.category_slug && GOOGLE_CATEGORY_MAP[p.category_slug]) ||
          "Apparel & Accessories > Clothing";
        const description = p.description
          ? escapeXml(p.description.slice(0, 5000))
          : escapeXml(p.name);

        return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${productUrl}</g:link>
      ${imageUrl ? `<g:image_link>${imageUrl}</g:image_link>` : ""}
      <g:price>${price} INR</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${BRAND_NAME}</g:brand>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${BRAND_NAME} Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Product feed for Google Merchant Center — ${BRAND_NAME}</description>
    ${feedItems}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=UTF-8",
        // Allow CDN caching for 6 hours, stale-while-revalidate for 1 hour beyond that
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[google-merchant feed] Unexpected error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
