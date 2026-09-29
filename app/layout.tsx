import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BRAND } from "@/lib/constants";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { CartToast } from "@/features/cart";

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

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} | Modern Everyday Luxury & Contemporary Clothing`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "Velaash",
    "Contemporary Clothing",
    "Kurtas and Sets",
    "Designer Dresses",
    "Co-ord Sets",
    "Contemporary Womenswear",
    "VELAASH TRADER'S",
  ],
  authors: [{ name: BRAND.legalName }],
  openGraph: {
    title: `${BRAND.name} | Modern Everyday Luxury & Contemporary Clothing`,
    description: BRAND.description,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialUser = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    initialUser = user;
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
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="bg-brand-cream text-brand-dark selection:bg-brand-gold selection:text-brand-dark flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider initialUser={initialUser}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartToast />
        </AuthProvider>
      </body>
    </html>
  );
}
