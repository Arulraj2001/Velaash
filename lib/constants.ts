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
  contactEmail: "care@velaash.com",
  supportPhone: "+91 98765 43210",
  whatsappNumber: "+919876543210",
  whatsappMessage: "Hello Velaash! I would like to inquire about your clothing collection.",
  currency: "INR",
  currencySymbol: "₹",
  socialLinks: {
    instagram: "https://instagram.com/velaash",
    whatsapp: "https://wa.me/919876543210",
    facebook: "https://facebook.com/velaash",
    pinterest: "https://pinterest.com/velaash",
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
