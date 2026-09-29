"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ShoppingBag, Heart, Menu } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BRAND } from "@/lib/constants";
import type { NavigationCategory } from "@/features/navigation";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderNav } from "./header-nav";
import { SearchOverlay } from "./search-overlay";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { AccountHeaderButton } from "./account-header-button";

interface HeaderClientProps {
  categories: NavigationCategory[];
}

export function HeaderClient({ categories }: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Shrink header slightly on scroll with smooth transitions
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`border-brand-border/80 bg-brand-cream/95 sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 ${
          isScrolled ? "shadow-luxury py-0" : "shadow-none"
        }`}
      >
        {/* Top Dismissible Announcement Bar */}
        <AnnouncementBar />

        <Container size="xl">
          <div
            className={`flex items-center justify-between gap-4 transition-all duration-300 ${
              isScrolled ? "h-16" : "h-20"
            }`}
          >
            {/* Mobile Hamburger Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-brand-dark hover:text-brand-accent focus-visible:ring-brand-gold rounded-md p-2 focus:outline-none focus-visible:ring-2"
                aria-label="Open mobile navigation menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Boutique Logo Wordmark */}
            <div className="flex items-center">
              <Link
                href="/"
                className="group focus-visible:ring-brand-gold flex flex-col items-start rounded-sm px-1 focus-visible:ring-2 focus-visible:outline-none"
                aria-label={`${BRAND.name} Home`}
              >
                <span
                  className={`font-heading text-brand-dark group-hover:text-brand-accent font-semibold tracking-tight transition-all duration-300 ${
                    isScrolled ? "text-2xl sm:text-2xl" : "text-2xl sm:text-3xl"
                  }`}
                >
                  {BRAND.name}
                </span>
                <span className="text-brand-accent -mt-0.5 text-[9px] font-medium tracking-[0.25em] uppercase">
                  Boutique
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <HeaderNav categories={categories} />

            {/* Header Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Search collections"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Link with Count Badge */}
              <Link
                href="/account"
                className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold relative hidden rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:inline-flex"
                aria-label="Saved items in wishlist"
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                <span className="bg-brand-light text-brand-dark border-brand-gold/40 absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold shadow-xs">
                  0
                </span>
              </Link>

              {/* Patron Account Menu Button */}
              <AccountHeaderButton />

              {/* Cart Drawer Trigger with Count Badge */}
              <Link
                href="/cart"
                className="text-brand-dark/80 hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold relative rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Shopping bag containing 0 items"
                title="Bag"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="bg-brand-gold text-brand-dark absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                  0
                </span>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* Search Overlay Shell */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
      />
    </>
  );
}
