import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BRAND } from "@/lib/constants";

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
    default: `${BRAND.name} | Luxury Indian Designer Clothing & Couture`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "Velaash",
    "Indian Boutique",
    "Haute Couture",
    "Designer Lehengas",
    "Silk Sarees",
    "Luxury Ethnic Wear",
    "VELAASH TRADER'S",
  ],
  authors: [{ name: BRAND.legalName }],
  openGraph: {
    title: `${BRAND.name} | Luxury Indian Designer Clothing`,
    description: BRAND.description,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="bg-brand-cream text-brand-dark selection:bg-brand-gold selection:text-brand-dark flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
