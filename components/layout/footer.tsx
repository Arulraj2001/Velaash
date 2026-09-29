import * as React from "react";
import Link from "next/link";
import { BRAND, CUSTOMER_SERVICE_LINKS, LEGAL_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/container";
import { getNavigationCategories } from "@/features/navigation";
import { getSiteSettings } from "@/features/settings";
import { FooterAccordionItem } from "./footer-accordion-item";
import { NewsletterForm } from "./newsletter-form";
import {
  Instagram,
  MessageCircle,
  Facebook,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const [categories, { storeProfile, socialLinks }] = await Promise.all([
    getNavigationCategories(),
    getSiteSettings(),
  ]);

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
                  {storeProfile.name}
                </span>
                <p className="text-brand-cream/60 text-[11px] tracking-widest uppercase">
                  {storeProfile.tagline}
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
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    aria-label="Follow Velaash on Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    aria-label="Chat with Velaash on WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-dark-muted text-brand-cream hover:text-brand-gold hover:bg-brand-accent/30 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    aria-label="Connect with Velaash on Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
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
                    <p>Support: {storeProfile.whatsapp_number || storeProfile.phone}</p>
                    {/* Flag: Temporary contact email bestrchandra@gmail.com; to be replaced with a professional domain email (e.g. care@velaash.com) once provisioned by client */}
                    <p>Email: {storeProfile.email}</p>
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
              <span className="flex items-center gap-1">
                <Banknote className="text-brand-gold h-3.5 w-3.5" /> Cash on Delivery (COD)
              </span>
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

            <div className="text-brand-cream/60 flex items-center gap-5 text-xs">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-brand-gold transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
