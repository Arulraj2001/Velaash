import * as React from "react";
import Link from "next/link";
import { BRAND, NAV_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/container";
import { Search, ShoppingBag, Heart, Menu } from "lucide-react";
import { AccountHeaderButton } from "./account-header-button";

export function Header() {
  return (
    <header className="border-brand-border/80 bg-brand-cream/95 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      {/* Top boutique announcement strip */}
      <div className="bg-brand-dark text-brand-gold px-4 py-1.5 text-center text-[11px] font-medium tracking-widest uppercase">
        Complimentary Bespoke Fitting & Express Shipping across India
      </div>

      <Container size="xl">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            className="text-brand-dark hover:text-brand-accent focus-visible:ring-brand-gold inline-flex rounded-md p-2 focus:outline-none focus-visible:ring-2 md:hidden"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Boutique Brand Logo */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="group focus-visible:ring-brand-gold flex flex-col items-start rounded-sm px-1 focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="font-heading text-brand-dark group-hover:text-brand-accent text-2xl font-semibold tracking-tight transition-colors sm:text-3xl">
                {BRAND.name}
              </span>
              <span className="text-brand-accent text-[9px] font-medium tracking-[0.25em] uppercase">
                Haute Couture
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-brand-dark/80 hover:text-brand-accent after:bg-brand-gold relative py-1 text-xs font-medium tracking-widest uppercase transition-colors duration-150 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Search collections"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold hidden rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </button>

            {/* Dynamic Real-time Patron Account Button */}
            <AccountHeaderButton />

            <button
              type="button"
              className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold relative rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="bg-brand-gold text-brand-dark absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                0
              </span>
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
}
