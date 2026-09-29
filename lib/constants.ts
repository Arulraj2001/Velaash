/**
 * Brand and Application Constants for Velaash
 * Legal Entity: VELAASH TRADER'S
 */

export const BRAND = {
  name: "Velaash",
  legalName: "VELAASH TRADER'S",
  tagline: "Contemporary Elegance, Timeless Style",
  description:
    "An exclusive boutique celebrating thoughtful design, refined fabrics, and effortless contemporary silhouettes for your everyday and occasion wardrobe.",
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

export const DEFAULT_ANNOUNCEMENT = {
  text: "Complimentary express delivery on orders above ₹999 | Use code VELAASH10 for 10% off",
  link: "/collections/new-arrivals",
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
