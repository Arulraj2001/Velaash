import * as React from "react";
import Link from "next/link";
import { BRAND, FOOTER_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-brand-accent/20 bg-brand-dark text-brand-cream border-t">
      {/* Top Footer Section */}
      <div className="border-brand-cream/10 border-b py-14 sm:py-16">
        <Container size="xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-4">
              <div className="space-y-1">
                <span className="font-heading text-brand-gold text-3xl font-normal tracking-wide">
                  {BRAND.name}
                </span>
                <p className="text-brand-cream/60 text-[11px] tracking-widest uppercase">
                  {BRAND.tagline}
                </p>
              </div>
              <p className="text-brand-cream/70 max-w-sm font-sans text-xs leading-relaxed">
                {BRAND.description}
              </p>
              <div className="text-brand-cream/60 space-y-1 pt-2 font-sans text-xs">
                <p>
                  Legal Entity:{" "}
                  <span className="text-brand-gold font-medium">{BRAND.legalName}</span>
                </p>
                <p>Contact: {BRAND.contactEmail}</p>
                <p>Customer Care: {BRAND.supportPhone}</p>
              </div>
            </div>

            {/* Quick Links Column 1 */}
            <div className="space-y-3 md:col-span-2">
              <h4 className="text-brand-gold text-xs font-semibold tracking-widest uppercase">
                The Boutique
              </h4>
              <ul className="text-brand-cream/70 space-y-2 font-sans text-xs">
                {FOOTER_LINKS.boutique.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-brand-gold transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links Column 2 */}
            <div className="space-y-3 md:col-span-3">
              <h4 className="text-brand-gold text-xs font-semibold tracking-widest uppercase">
                Client Concierge
              </h4>
              <ul className="text-brand-cream/70 space-y-2 font-sans text-xs">
                {FOOTER_LINKS.customerCare.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-brand-gold transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links Column 3 - Legal */}
            <div className="space-y-3 md:col-span-3">
              <h4 className="text-brand-gold text-xs font-semibold tracking-widest uppercase">
                Policies & Trust
              </h4>
              <ul className="text-brand-cream/70 space-y-2 font-sans text-xs">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-brand-gold transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="bg-brand-dark/95 py-6">
        <Container size="xl">
          <div className="text-brand-cream/50 flex flex-col items-center justify-between gap-4 font-sans text-xs sm:flex-row">
            <p>
              &copy; {currentYear} {BRAND.legalName}. All rights reserved.
            </p>
            <p className="flex items-center gap-2 text-[11px] tracking-wider uppercase">
              Handcrafted in India • Pure Heritage Silk & Couture
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
