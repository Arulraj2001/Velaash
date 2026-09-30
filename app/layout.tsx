import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BRAND } from "@/lib/constants";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { CartToast } from "@/features/cart";
import { WishlistSync, getWishlistProductIds } from "@/features/wishlist";
import { AnalyticsScripts, CookieConsentBanner } from "@/features/analytics";
import { env } from "@/lib/env";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

import { getSiteSettings } from "@/features/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { storeProfile, seoDefaults } = await getSiteSettings();
  const brandName = storeProfile.name || BRAND.name;
  const titleDefault = seoDefaults.meta_title || `${brandName} | Modern Everyday Luxury & Contemporary Clothing`;
  const descriptionDefault = seoDefaults.meta_description || BRAND.description;

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL || "https://velaash.in"),
    title: {
      default: titleDefault,
      template: `%s | ${brandName}`,
    },
    description: descriptionDefault,
    keywords: [
      brandName,
      storeProfile.legal_name || BRAND.legalName,
      "Contemporary Clothing",
      "Kurtas and Sets",
      "Designer Dresses",
      "Co-ord Sets",
      "Contemporary Womenswear",
      "VELAASH TRADER'S",
    ],
    authors: [{ name: storeProfile.legal_name || BRAND.legalName }],
    icons: {
      icon: storeProfile.favicon_url || "/favicon.ico",
    },
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
  // Detect admin routes via the x-pathname header injected by middleware.
  // Admin pages have their own sidebar + topbar shell — no customer nav/footer needed.
  let isAdminRoute = false;
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    isAdminRoute = pathname.startsWith("/admin");
  } catch {
    // Outside request context — default to showing the customer shell
  }

  let initialUser = null;
  let initialWishlistIds: string[] = [];
  if (!isAdminRoute) {
    try {
      const supabase = await createClient();
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
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="bg-brand-cream text-brand-dark selection:bg-brand-gold selection:text-brand-dark flex min-h-screen flex-col font-sans antialiased">
        {isAdminRoute ? (
          // Admin shell: no customer header/footer — admin/layout.tsx handles its own chrome
          <>{children}</>
        ) : (
          <AuthProvider initialUser={initialUser}>
            <WishlistSync initialWishlistIds={initialWishlistIds} />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartToast />
            <AnalyticsScripts />
            <CookieConsentBanner />
          </AuthProvider>
        )}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "yqemtpkwtz"}");`,
          }}
        />
      </body>
    </html>
  );
}
