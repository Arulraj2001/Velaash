import * as React from "react";
import Link from "next/link";
import { BRAND, CUSTOMER_SERVICE_LINKS, LEGAL_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/container";
import { getNavigationCategories } from "@/features/navigation";
import { getSiteSettings } from "@/features/settings";
import { getStoreContact } from "@/features/settings";
import { FooterAccordionItem } from "./footer-accordion-item";
import { NewsletterForm } from "./newsletter-form";
import { CookiePreferencesButton } from "@/features/analytics";
import {
  Instagram,
  MessageCircle,
  Facebook,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";

function PinterestIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const [categories, { storeProfile, socialLinks, paymentSettings }] = await Promise.all([
    getNavigationCategories(),
    getSiteSettings(),
  ]);
  const { email, whatsappNumber, whatsappUrl } = getStoreContact(storeProfile);

  return (
    <footer className="border-brand-accent/20 bg-brand-dark text-brand-cream border-t font-sans">
      {/* Main 4-Column Footer Section */}
      <div className="border-brand-cream/10 border-b py-12 sm:py-16">
        <Container size="xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-10">
            {/* Column 1: Brand Blurb & Social Media */}
            <div className="space-y-4 md:col-span-4">
              <div className="space-y-1">
                <span className="font-heading text-brand-gold text-3xl font-semibold tracking-wide">
                  {storeProfile.name || BRAND.name}
                </span>
                <p className="text-brand-cream/60 text-[11px] tracking-widest uppercase">
                  {storeProfile.tagline && storeProfile.tagline !== "Contemporary Elegance, Timeless Style"
                    ? storeProfile.tagline
                    : BRAND.tagline}
                </p>
              </div>

              <p className="text-brand-cream/70 max-w-sm text-xs leading-relaxed">
                {BRAND.description}
              </p>

                {/* Social Media Links */}
                <div className="pt-2">
                  <p className="text-brand-gold mb-2.5 text-[11px] font-semibold tracking-wider uppercase">
                    Follow Our Journey
                  </p>
                  <div className="flex items-center gap-3">
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        aria-label="Follow Velaash on Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        aria-label="Chat with Velaash on WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        aria-label="Connect with Velaash on Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.pinterest && (
                      <a
                        href={socialLinks.pinterest}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        aria-label="Follow Velaash on Pinterest"
                      >
                        <PinterestIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
            </div>

            {/* Column 2: Shop / Collections Links (Accordion on mobile) */}
            <div className="md:col-span-2">
              <FooterAccordionItem title="Shop Collections">
                <ul className="text-brand-cream/70 space-y-2 text-xs">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/collections/${cat.slug}`}
                        className="hover:text-brand-gold block py-0.5 transition-colors duration-150"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterAccordionItem>
            </div>

            {/* Column 3: Customer Care (Accordion on mobile) */}
            <div className="md:col-span-3">
              <FooterAccordionItem title="Customer Care">
                <ul className="text-brand-cream/70 space-y-2 text-xs">
                  {CUSTOMER_SERVICE_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="hover:text-brand-gold block py-0.5 transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li className="text-brand-cream/50 space-y-0.5 pt-2 text-[11px]">
                    <p>Support: {whatsappNumber}</p>
                    <p>Email: {email}</p>
                  </li>
                </ul>
              </FooterAccordionItem>
            </div>

            {/* Column 4: Newsletter Signup */}
            <div className="space-y-3 md:col-span-3">
              <h4 className="text-brand-gold text-xs font-semibold tracking-widest uppercase">
                The Velaash Edit
              </h4>
              <NewsletterForm />
            </div>
          </div>
        </Container>
      </div>

      {/* Payment Trust & Security Row */}
      <div className="border-brand-cream/10 bg-brand-dark-muted/30 border-b py-5">
        <Container size="xl">
          <div className="text-brand-cream/70 flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
            <span className="text-brand-gold flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase">
              <ShieldCheck className="text-brand-gold h-4 w-4" />
              100% Secure & Insured Checkout
            </span>

            <div className="text-brand-cream/60 flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <Smartphone className="text-brand-gold h-3.5 w-3.5" /> UPI (GPay, PhonePe, Paytm)
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="text-brand-gold h-3.5 w-3.5" /> Cards (Visa, Mastercard,
                RuPay)
              </span>
              {paymentSettings?.cod_enabled && (
                <span className="flex items-center gap-1">
                  <Banknote className="text-brand-gold h-3.5 w-3.5" /> Cash on Delivery (COD)
                </span>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="bg-brand-dark/95 py-6">
        <Container size="xl">
          <div className="text-brand-cream/50 flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
            <p>
              &copy; {currentYear}{" "}
              <span className="text-brand-gold font-medium">{storeProfile.legal_name}</span>. All
              rights reserved.
            </p>

            <div className="text-brand-cream/60 flex flex-wrap items-center gap-5 text-xs">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-brand-gold transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
              <CookiePreferencesButton />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
