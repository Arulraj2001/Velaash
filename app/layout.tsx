import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CustomerShell } from "@/components/layout/customer-shell";
import { BRAND } from "@/lib/constants";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { CartToast } from "@/features/cart";
import { WishlistSync } from "@/features/wishlist";
import { AnalyticsScripts, DeferredCookieConsentBanner } from "@/features/analytics";
import { BrandPreloader, PromoOfferPopup, WhatsAppFloat } from "@/components/ui";
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
  const titleDefault =
    seoDefaults.meta_title || `${brandName} — Everyday essentials for every home`;
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
    ? seoDefaults.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
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
      google:
        env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "PiKfxQxUuM8Kq1JpvpByh0u8dBuRdHMWvlKPqpBUylk",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let logoUrl: string | null = null;
  let promoPopupData = null;
  let whatsappHref = "";
  let whatsappDisplay = "";

  try {
    const [{ storeProfile }, promoPopup] = await Promise.all([
      getSiteSettings(),
      getPromoPopup(),
    ]);
    logoUrl = storeProfile.logo_url || "/logo.png";
    promoPopupData = promoPopup;

    // Build WhatsApp contact from admin-configured number
    const waRaw = (storeProfile.whatsapp_number || storeProfile.phone || "").trim();
    const waDigits = waRaw.replace(/\D/g, "");
    if (waDigits) {
      const defaultMessage =
        "Hi Velaash! I would like help choosing a product or placing an order.";
      whatsappHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(defaultMessage)}`;
      whatsappDisplay = waRaw.startsWith("+") ? waRaw : `+${waDigits}`;
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
  }

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${plusJakarta.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="bg-brand-cream text-brand-dark selection:bg-brand-gold selection:text-brand-dark flex min-h-screen flex-col font-sans antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <WishlistSync />
          <CustomerShell
            header={<Header />}
            footer={<Footer />}
            overlays={
              <>
                <BrandPreloader logoUrl={logoUrl} />
                <CartToast />
                <DeferredCookieConsentBanner />
                <PromoOfferPopup data={promoPopupData} />
                <WhatsAppFloat href={whatsappHref} displayNumber={whatsappDisplay} />
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
