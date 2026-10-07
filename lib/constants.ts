/**
 * Brand and Application Constants for Velaash
 * Legal Entity: VELAASH TRADER'S
 */

export const BRAND = {
  name: "Velaash",
  legalName: "VELAASH TRADER'S",
  tagline: "Velaash — Everyday essentials for every home",
  description:
    "Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.",
  contactEmail: "",
  supportPhone: "",
  whatsappNumber: "",
  whatsappUrl: "",
  whatsappMessage: "Hello Velaash! I would like to inquire about your products.",
  currency: "INR",
  currencySymbol: "₹",
  socialLinks: {
    // Note: Official handles not yet provided by client - marked placeholders, editable via site_settings in admin panel
    instagram: "https://instagram.com/velaash", // Placeholder - awaiting client handle
    facebook: "https://facebook.com/velaash", // Placeholder - awaiting client handle
    pinterest: "https://pinterest.com/velaash", // Placeholder
  },
} as const;

/**
 * Neutral announcement bar placeholder.
 * TODO: [PRE-LAUNCH REQUIREMENT] Real promotional offers and coupon codes must be set by client in admin panel before launch.
 */
export const DEFAULT_ANNOUNCEMENT = {
  text: "Welcome to Velaash — New Arrivals Every Week",
  link: "/shop",
};

export const CUSTOMER_SERVICE_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Replacements", href: "/shipping-returns" },
  { label: "Size & Fit Guide", href: "/size-guide" },
  { label: "Track Your Order", href: "/track-order" },
  { label: "Frequently Asked Questions", href: "/faq" },
] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Shipping & Replacements", href: "/shipping-returns" },
] as const;
