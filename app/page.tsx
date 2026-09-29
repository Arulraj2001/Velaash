import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, RotateCcw, ShieldCheck, MessageCircle, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { getNavigationCategories } from "@/features/navigation";
import { getProducts, ProductCard } from "@/features/products";
import { getSiteSettings } from "@/features/settings";
import { HomepageNewsletter } from "@/components/homepage/homepage-newsletter";

// SEO: Generate homepage metadata using clean brand defaults
export async function generateMetadata(): Promise<Metadata> {
  const { storeProfile } = await getSiteSettings();

  const title = `${storeProfile.name || BRAND.name} | Modern Everyday Luxury & Contemporary Clothing`;
  const description =
    "Contemporary clothing designed with refined fabrics and effortless silhouettes for your everyday and occasion wardrobe.";

  return {
    title,
    description,
    keywords: [
      storeProfile.name || BRAND.name,
      storeProfile.legal_name || BRAND.legalName,
      "Contemporary Clothing",
      "Kurtas & Sets",
      "Dresses",
      "Co-ord Sets",
      "Indian Everyday Wear",
    ],
    openGraph: {
      title,
      description,
      url: "https://velaash.com",
      siteName: storeProfile.name || BRAND.name,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 630,
          alt: `${storeProfile.name || BRAND.name} - Contemporary Clothing`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Fallback images for category tiles if not configured in the database
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "kurtas-sets":
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
  dresses:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
  "co-ord-sets":
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  "tops-tunics":
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
  "pants-trousers":
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
};

export default async function HomePage() {
  // Fetch real categories and featured products concurrently
  const [categories, { products: featuredProducts }, siteSettings] = await Promise.all([
    getNavigationCategories(),
    getProducts({ limit: 8, sort: "featured" }),
    getSiteSettings(),
  ]);

  /**
   * PLACEHOLDER HERO IMAGE:
   * High-resolution editorial placeholder.
   * NOTE: Real photography will be provided by the client and can be configured
   * via site_settings in Supabase or the admin console before official store launch.
   */
  const placeholderHeroImage =
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85";

  // Organization Schema.org JSON-LD using strictly verified business information
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteSettings.storeProfile.name || BRAND.name,
    legalName: siteSettings.storeProfile.legal_name || BRAND.legalName,
    url: "https://velaash.com",
    email: siteSettings.storeProfile.email || BRAND.contactEmail,
    telephone: siteSettings.storeProfile.whatsapp_number || BRAND.supportPhone,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteSettings.storeProfile.whatsapp_number || BRAND.supportPhone,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    ],
  };

  return (
    <>
      {/* 0. Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="flex flex-col min-h-screen bg-brand-cream/30 text-brand-dark">
        {/* =========================================================================
            SECTION 1: HERO BANNER
            Full-width image visual with headline and primary CTA linking to /shop.
            ========================================================================= */}
        <section className="relative w-full min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-dark">
          {/* Background Image with subtle parallax feel */}
          <div className="absolute inset-0 z-0">
            <Image
              src={placeholderHeroImage}
              alt="Velaash Contemporary Clothing Collection"
              fill
              priority
              className="object-cover object-center brightness-90 contrast-105"
              sizes="100vw"
            />
            {/* Rich gradient overlays for depth and text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-black/30" />
            <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-[0.5px]" />
          </div>

          {/* Hero Content */}
          <Container size="lg" className="relative z-10 py-16 text-center">
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-700">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-gold/40 bg-brand-dark/60 text-brand-gold text-xs font-semibold tracking-widest uppercase backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Season Arrivals</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight leading-[1.08]">
                Modern Everyday Luxury
              </h1>

              <p className="max-w-xl mx-auto text-brand-cream/85 font-sans text-sm sm:text-base md:text-lg leading-relaxed">
                Effortless silhouettes, refined textures, and contemporary wardrobe essentials
                designed for everyday elegance.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href="/shop" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-luxury">
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/collections/kurtas-sets" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 hover:text-white"
                  >
                    Kurtas & Sets
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            SECTION 2: CATEGORY TILES
            Visual grid linking to each top-level category using categories query.
            ========================================================================= */}
        <section className="py-16 sm:py-24 border-b border-brand-border/60">
          <Container size="xl">
            {/* Section Header */}
            <div className="max-w-2xl mx-auto text-center space-y-2 mb-10 sm:mb-14">
              <span className="text-brand-accent text-xs font-semibold tracking-widest uppercase">
                Curated Collections
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
                Explore by Category
              </h2>
              <p className="text-brand-dark/70 text-xs sm:text-sm font-sans">
                Thoughtfully tailored pieces across modern everyday silhouettes.
              </p>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((category) => {
                const categoryImage =
                  category.image_url ||
                  DEFAULT_CATEGORY_IMAGES[category.slug] ||
                  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80";

                return (
                  <Link
                    key={category.id}
                    href={`/collections/${category.slug}`}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xs hover:shadow-luxury transition-all duration-300 border border-brand-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  >
                    {/* Background Category Image with gentle zoom on hover */}
                    <Image
                      src={categoryImage}
                      alt={category.name}
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/25 to-transparent transition-opacity duration-300 group-hover:from-brand-dark/95" />

                    {/* Content Card at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end text-left">
                      <h3 className="font-heading text-lg sm:text-2xl font-semibold text-white tracking-tight">
                        {category.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-brand-gold group-hover:text-brand-gold/90 transition-colors">
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>

        {/* =========================================================================
            SECTION 3: FEATURED / NEW ARRIVALS
            Row of products where is_featured = true (or newest) using ProductCard.
            ========================================================================= */}
        <section className="py-16 sm:py-24 bg-brand-light/10 border-b border-brand-border/60">
          <Container size="xl">
            {/* Section Header with View All Link */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 sm:mb-12">
              <div className="space-y-1">
                <span className="text-brand-accent text-xs font-semibold tracking-widest uppercase">
                  Handpicked Styles
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
                  Featured Arrivals
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-dark hover:text-brand-accent transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Product Cards Grid */}
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-brand-border/70 p-8">
                <p className="text-brand-dark/70 text-sm">
                  Catalog updates in progress. Explore our collection categories above.
                </p>
                <Link href="/shop" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            )}
          </Container>
        </section>

        {/* =========================================================================
            SECTION 4: TRUST & VALUE STRIP
            Generic 3-4 short items without unconfirmed claims or fabricated numbers.
            ========================================================================= */}
        <section className="py-12 sm:py-16 bg-white border-b border-brand-border/60">
          <Container size="xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Value 1: Pan-India Delivery */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 p-4 rounded-xl transition-colors hover:bg-brand-cream/40">
                <div className="w-12 h-12 rounded-full bg-brand-light/50 border border-brand-gold/30 flex items-center justify-center text-brand-dark shrink-0">
                  <Truck className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-base sm:text-lg font-semibold text-brand-dark">
                    Pan-India Delivery
                  </h4>
                  <p className="text-brand-dark/65 text-xs font-sans leading-relaxed">
                    Reliable domestic shipping across all serviceable PIN codes.
                  </p>
                </div>
              </div>

              {/* Value 2: Easy Returns */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 p-4 rounded-xl transition-colors hover:bg-brand-cream/40">
                <div className="w-12 h-12 rounded-full bg-brand-light/50 border border-brand-gold/30 flex items-center justify-center text-brand-dark shrink-0">
                  <RotateCcw className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-base sm:text-lg font-semibold text-brand-dark">
                    Easy Returns
                  </h4>
                  <p className="text-brand-dark/65 text-xs font-sans leading-relaxed">
                    Hassle-free return and exchange assistance for unworn items.
                  </p>
                </div>
              </div>

              {/* Value 3: Secure Payments */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 p-4 rounded-xl transition-colors hover:bg-brand-cream/40">
                <div className="w-12 h-12 rounded-full bg-brand-light/50 border border-brand-gold/30 flex items-center justify-center text-brand-dark shrink-0">
                  <ShieldCheck className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-base sm:text-lg font-semibold text-brand-dark">
                    Secure Payments
                  </h4>
                  <p className="text-brand-dark/65 text-xs font-sans leading-relaxed">
                    100% encrypted checkout with UPI, Cards, and Net Banking.
                  </p>
                </div>
              </div>

              {/* Value 4: WhatsApp Support */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 p-4 rounded-xl transition-colors hover:bg-brand-cream/40">
                <div className="w-12 h-12 rounded-full bg-brand-light/50 border border-brand-gold/30 flex items-center justify-center text-brand-dark shrink-0">
                  <MessageCircle className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-base sm:text-lg font-semibold text-brand-dark">
                    WhatsApp Support
                  </h4>
                  <p className="text-brand-dark/65 text-xs font-sans leading-relaxed">
                    Direct assistance and sizing guidance on +91 8508643832.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            SECTION 5: NEWSLETTER SIGNUP
            Enhanced newsletter signup styled for a prominent homepage section.
            ========================================================================= */}
        <section className="py-16 sm:py-24 bg-brand-cream/60">
          <Container size="md">
            <div className="rounded-3xl bg-brand-dark border border-brand-accent/25 text-brand-cream p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
              {/* Subtle ambient luxury light in background */}
              <div className="absolute top-0 right-1/4 -translate-y-1/2 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-64 h-64 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-lg mx-auto space-y-3">
                <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-semibold tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Stay In Touch</span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
                  Join the Velaash Circle
                </h2>

                <p className="text-brand-cream/75 text-xs sm:text-sm font-sans leading-relaxed">
                  Subscribe to receive updates on new arrivals, seasonal collections, and wardrobe
                  inspiration directly to your inbox.
                </p>

                {/* Client-side Newsletter Form */}
                <HomepageNewsletter />
              </div>
            </div>
          </Container>
        </section>
      </div>
    </>
  );
}
