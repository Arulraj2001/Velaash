"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Heart, Menu } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BrandWordmark } from "@/components/ui";
import { BRAND } from "@/lib/constants";
import type { NavigationCategory } from "@/features/navigation";
import type { AnnouncementSetting, ShippingPolicySetting } from "@/features/settings";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderNav } from "./header-nav";
import { SearchOverlay } from "./search-overlay";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { AccountHeaderButton } from "./account-header-button";
import { useCartCount } from "@/features/cart";
import { useWishlistStore } from "@/features/wishlist/store/wishlist-store";

interface HeaderClientProps {
  categories: NavigationCategory[];
  shippingPolicy?: ShippingPolicySetting;
  logoUrl?: string;
  storeName?: string;
  whatsappNumber?: string;
  whatsappUrl?: string;
  announcement?: AnnouncementSetting;
}

export function HeaderClient({
  categories,
  shippingPolicy,
  logoUrl,
  storeName,
  whatsappNumber,
  whatsappUrl,
  announcement,
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { count: cartCount } = useCartCount();
  const wishlistCount = useWishlistStore((state) => state.wishlistIds.length);

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
          isScrolled ? "shadow-xs py-0" : "shadow-none"
        }`}
      >
        {/* Top Dismissible Announcement Bar */}
        <AnnouncementBar
          text={announcement?.text}
          link={announcement?.link}
          isEnabled={announcement?.is_enabled}
          speed={announcement?.speed}
        />

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

            {/* Logo Wordmark & Emblem */}
            <div className="flex items-center">
              <Link
                href="/"
                className="group focus-visible:ring-brand-gold flex items-center gap-2.5 rounded-sm px-1 focus-visible:ring-2 focus-visible:outline-none"
                aria-label={`${storeName || BRAND.name} Home`}
              >
                {logoUrl && (
                  <div
                    className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200/80 bg-white shadow-xs transition-all duration-300 ${
                      isScrolled ? "h-10 w-10 sm:h-11 sm:w-11" : "h-11 w-11 sm:h-12 sm:w-12"
                    }`}
                  >
                    <Image
                      src={logoUrl}
                      alt={storeName || BRAND.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 44px, 48px"
                    />
                  </div>
                )}
                <BrandWordmark
                  storeName={storeName || BRAND.name}
                  isScrolled={isScrolled}
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <HeaderNav categories={categories} shippingPolicy={shippingPolicy} />

            {/* Header Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="text-brand-muted hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Search collections"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Link with Count Badge */}
              <Link
                href="/account/wishlist"
                className="text-brand-muted hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold relative hidden rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:inline-flex"
                aria-label={`Saved items in wishlist (${wishlistCount})`}
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                <span
                  suppressHydrationWarning
                  className="bg-brand-light text-brand-dark border-brand-gold/40 absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold shadow-xs"
                >
                  {wishlistCount}
                </span>
              </Link>

              {/* Account Menu Button */}
              <AccountHeaderButton />

              {/* Cart Drawer Trigger with Count Badge */}
              <Link
                href="/cart"
                className="text-brand-muted hover:text-brand-accent hover:bg-brand-light/30 focus-visible:ring-brand-gold relative rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label={`Shopping bag containing ${cartCount} items`}
                title="Bag"
              >
                <ShoppingBag className="h-5 w-5" />
                <span
                  suppressHydrationWarning
                  className="bg-brand-gold text-brand-dark absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm"
                >
                  {cartCount}
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
        shippingPolicy={shippingPolicy}
        logoUrl={logoUrl}
        storeName={storeName}
        whatsappNumber={whatsappNumber}
        whatsappUrl={whatsappUrl}
      />
    </>
  );
}
