/**
 * Brand and Application Constants for Velaash
 */

export const BRAND = {
  name: "Velaash",
  legalName: "VELAASH TRADER'S",
  tagline: "Where Heritage Craft Meets Contemporary Elegance",
  description:
    "An exclusive Indian luxury clothing boutique celebrating timeless craftsmanship, royal silhouettes, and modern artistry.",
  contactEmail: "care@velaash.com",
  supportPhone: "+91 98765 43210",
  currency: "INR",
  currencySymbol: "₹",
} as const;

export const NAV_LINKS = [
  { label: "New Arrivals", href: "#" },
  { label: "Bridal & Festive", href: "#" },
  { label: "Pre-order Couture", href: "#" },
  { label: "Sarees & Lehengas", href: "#" },
  { label: "Our Story", href: "#" },
] as const;

export const FOOTER_LINKS = {
  boutique: [
    { label: "About Velaash", href: "#" },
    { label: "Artisans & Heritage", href: "#" },
    { label: "Bespoke Consultations", href: "#" },
    { label: "Press & Features", href: "#" },
  ],
  customerCare: [
    { label: "Shipping & Delivery", href: "#" },
    { label: "Returns & Exchanges", href: "#" },
    { label: "Track Your Order", href: "#" },
    { label: "Size Guide", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Shipping Policy", href: "#" },
    { label: "Legal Notice", href: "#" },
  ],
} as const;
