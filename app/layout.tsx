import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CustomerShell } from "@/components/layout/customer-shell";
import { BRAND } from "@/lib/constants";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { CartToast } from "@/features/cart";
import { WishlistSync, getWishlistProductIds } from "@/features/wishlist";
import { AnalyticsScripts, CookieConsentBanner } from "@/features/analytics";
import { BrandPreloader, PromoOfferPopup } from "@/components/ui";
import { env } from "@/lib/env";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

import { getSiteSettings, getPromoPopup } from "@/features/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { storeProfile, seoDefaults } = await getSiteSettings();
  const brandName = storeProfile.name || BRAND.name;
  const titleDefault = seoDefaults.meta_title || `${brandName} — Everyday essentials for every home`;
  const descriptionDefault = seoDefaults.meta_description || BRAND.description;

  const defaultKeywords = [
    brandName,
    storeProfile.legal_name || BRAND.legalName,
    "Everyday essentials",
    "Clothing for men and women",
    "Pooja essentials",
    "Brass essentials",
    "Contemporary Clothing",
    "Kurtas and Sets",
    "Co-ord Sets",
    "ஆடை",
    "கடை",
  ];
  const configuredKeywords = seoDefaults.keywords
    ? seoDefaults.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const siteKeywords = Array.from(new Set([...defaultKeywords, ...configuredKeywords]));

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL || "https://velaash.in"),
    title: {
      default: titleDefault,
      template: `%s | ${brandName}`,
    },
    description: descriptionDefault,
    keywords: siteKeywords,
    authors: [{ name: storeProfile.legal_name || BRAND.legalName }],
    icons: {
      icon:
        storeProfile.favicon_url &&
        storeProfile.favicon_url.trim().length > 0 &&
        storeProfile.favicon_url !== "/favicon.ico"
          ? [
              { url: storeProfile.favicon_url },
              { url: "/favicon.svg", type: "image/svg+xml" },
              { url: "/favicon.ico", sizes: "any" },
            ]
          : [
              { url: "/favicon.ico", sizes: "any" },
              { url: "/favicon.svg", type: "image/svg+xml" },
              { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
              { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
            ],
      shortcut: [
        storeProfile.favicon_url &&
        storeProfile.favicon_url.trim().length > 0 &&
        storeProfile.favicon_url !== "/favicon.ico"
          ? storeProfile.favicon_url
          : "/favicon.ico",
      ],
      apple: [
        {
          url:
            storeProfile.favicon_url &&
            storeProfile.favicon_url.trim().length > 0 &&
            storeProfile.favicon_url !== "/favicon.ico"
              ? storeProfile.favicon_url
              : "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: titleDefault,
      description: descriptionDefault,
      siteName: brandName,
      locale: "en_IN",
      type: "website",
    },
    // Google Search Console HTML-tag verification.
    verification: {
      google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "PiKfxQxUuM8Kq1JpvpByh0u8dBuRdHMWvlKPqpBUylk",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialUser = null;
  let initialWishlistIds: string[] = [];
  let logoUrl: string | null = null;
  let promoPopupData = null;

  try {
    const [{ storeProfile }, supabase, promoPopup] = await Promise.all([
      getSiteSettings(),
      createClient(),
      getPromoPopup(),
    ]);
    logoUrl = storeProfile.logo_url || "/logo.png";
    promoPopupData = promoPopup;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    initialUser = user;
    if (user) {
      initialWishlistIds = await getWishlistProductIds(user.id);
    }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    initialUser = null;
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="bg-brand-cream text-brand-dark selection:bg-brand-gold selection:text-brand-dark flex min-h-screen flex-col font-sans antialiased" suppressHydrationWarning>
        <AuthProvider initialUser={initialUser}>
          <WishlistSync initialWishlistIds={initialWishlistIds} />
          <CustomerShell
            header={<Header />}
            footer={<Footer />}
            overlays={
              <>
                <BrandPreloader logoUrl={logoUrl} />
                <CartToast />
                <CookieConsentBanner />
                <PromoOfferPopup data={promoPopupData} />
              </>
            }
          >
            {children}
          </CustomerShell>
          <AnalyticsScripts />
        </AuthProvider>
      </body>
    </html>
  );
}
