/**
 * Brand and Application Constants for Velaash
 * Legal Entity: VELAASH TRADER'S
 */

export const BRAND = {
  name: "Velaash",
  legalName: "VELAASH TRADER'S",
  tagline: "", // Left blank per client direction — do not invent a tagline
  description:
    "Contemporary clothing designed with refined fabrics and effortless silhouettes for your everyday and occasion wardrobe.",
  // Flag: Temporary contact email until a professional domain email (e.g. care@velaash.com) is provisioned by the client
  contactEmail: "bestrchandra@gmail.com",
  supportPhone: "+91 8508643832",
  whatsappNumber: "+91 8508643832",
  whatsappUrl: "https://wa.me/918508643832",
  whatsappMessage: "Hello Velaash! I would like to inquire about your clothing collection.",
  currency: "INR",
  currencySymbol: "₹",
  socialLinks: {
    // Note: Official handles not yet provided by client - marked placeholders, editable via site_settings in admin panel
    instagram: "https://instagram.com/velaash", // Placeholder - awaiting client handle
    whatsapp: "https://wa.me/918508643832",
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
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "Size & Fit Guide", href: "/size-guide" },
  { label: "Track Your Order", href: "/track-order" },
  { label: "Frequently Asked Questions", href: "/faq" },
] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Shipping Policy", href: "/shipping-policy" },
] as const;
