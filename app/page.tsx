import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Package,
  Headphones,
  Heart,
  LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { getNavigationCategories } from "@/features/navigation";
import { getProducts, ProductCard, type ProductListItem } from "@/features/products";
import { getSiteSettings } from "@/features/settings";
import { getHomepageSections } from "@/features/homepage";
import { HomepageNewsletter } from "@/components/homepage/homepage-newsletter";

// SEO: Generate homepage metadata using dynamic site settings and brand fallbacks
export async function generateMetadata(): Promise<Metadata> {
  const { storeProfile, seoDefaults } = await getSiteSettings();

  const brandName = storeProfile.name || BRAND.name;
  const title =
    seoDefaults.meta_title || `${brandName} | Modern Everyday Luxury & Contemporary Clothing`;
  const description =
    seoDefaults.meta_description ||
    "Contemporary clothing designed with refined fabrics and effortless silhouettes for your everyday and occasion wardrobe.";

  return {
    title,
    description,
    keywords: [
      brandName,
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
      siteName: brandName,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 630,
          alt: `${brandName} - Contemporary Clothing`,
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

const TRUST_ICON_MAP: Record<string, LucideIcon> = {
  Truck,
  RotateCcw,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Package,
  Headphones,
  Heart,
};

export default async function HomePage() {
  // Fetch real categories, site settings, and admin-ordered active homepage sections
  const [categories, siteSettings, sections] = await Promise.all([
    getNavigationCategories(),
    getSiteSettings(),
    getHomepageSections(),
  ]);

  // Check if featured_products section is present in sections and resolve products
  const featuredSection = sections.find((s) => s.section_type === "featured_products");
  let featuredProducts: ProductListItem[] = [];

  if (featuredSection) {
    const content = (featuredSection.content as Record<string, unknown>) || {};
    const productIds = Array.isArray(content.product_ids) ? (content.product_ids as string[]) : [];
    if (content.mode === "manual" && productIds.length > 0) {
      // Manually curated ordered list of products
      const { products } = await getProducts({
        productIds,
        limit: productIds.length,
      });
      const map = new Map(products.map((p) => [p.id, p]));
      featuredProducts = productIds
        .map((id: string) => map.get(id))
        .filter((p): p is ProductListItem => Boolean(p));
    } else {
      // Auto-selected based on is_featured
      const { products } = await getProducts({
        limit: typeof content.limit === "number" ? content.limit : 8,
        sort: "featured",
      });
      featuredProducts = products;
    }
  }

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
        {/* Render Sections in their Admin-Configured Display Order */}
        {sections.map((section) => {
          switch (section.section_type) {
            case "hero_banner": {
              const content = (section.content as Record<string, unknown>) || {};
              const headline = (content.headline as string) || "Modern Everyday Luxury";
              const subtitle =
                (content.subtitle as string) ||
                (content.subheading as string) ||
                "Effortless silhouettes, refined textures, and contemporary wardrobe essentials designed for everyday elegance.";
              const ctaText =
                (content.cta_text as string) || (content.cta_label as string) || "Explore Collection";
              const ctaLink = (content.cta_link as string) || "/shop";
              const secondaryText = (content.secondary_cta_text as string) || "";
              const secondaryLink = (content.secondary_cta_link as string) || "";
              const bgImage =
                (content.bg_image as string) ||
                (content.image_url as string) ||
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85";

              return (
                <section
                  key={section.id}
                  className="relative w-full min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-dark"
                >
                  {/* Background Image with subtle gradient overlays */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={bgImage}
                      alt={headline}
                      fill
                      priority
                      className="object-cover object-center brightness-90 contrast-105"
                      sizes="100vw"
                    />
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
                        {headline}
                      </h1>

                      <p className="max-w-xl mx-auto text-brand-cream/85 font-sans text-sm sm:text-base md:text-lg leading-relaxed">
                        {subtitle}
                      </p>

                      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <Link href={ctaLink} className="w-full sm:w-auto">
                          <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-luxury">
                            <span>{ctaText}</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                        {secondaryText && secondaryLink ? (
                          <Link href={secondaryLink} className="w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 hover:text-white"
                            >
                              {secondaryText}
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </Container>
                </section>
              );
            }

            case "category_grid": {
              const content = (section.content as Record<string, unknown>) || {};
              const title = (content.title as string) || "Explore by Category";
              const subtitle =
                (content.subtitle as string) || "Thoughtfully tailored pieces across modern everyday silhouettes.";

              return (
                <section key={section.id} className="py-16 sm:py-24 border-b border-brand-border/60">
                  <Container size="xl">
                    {/* Section Header */}
                    <div className="max-w-2xl mx-auto text-center space-y-2 mb-10 sm:mb-14">
                      <span className="text-brand-accent-dark text-xs font-semibold tracking-widest uppercase">
                        Curated Collections
                      </span>
                      <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
                        {title}
                      </h2>
                      <p className="text-brand-muted text-xs sm:text-sm font-sans">{subtitle}</p>
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
                            <Image
                              src={categoryImage}
                              alt={category.name}
                              fill
                              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/25 to-transparent transition-opacity duration-300 group-hover:from-brand-dark/95" />
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
              );
            }

            case "featured_products": {
              const content = (section.content as Record<string, unknown>) || {};
              const title = (content.title as string) || "Featured Arrivals";
              const subtitle = (content.subtitle as string) || "Handpicked styles from our collection.";

              return (
                <section
                  key={section.id}
                  className="py-16 sm:py-24 bg-brand-light/10 border-b border-brand-border/60"
                >
                  <Container size="xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 sm:mb-12">
                      <div className="space-y-1">
                        <span className="text-brand-accent-dark text-xs font-semibold tracking-widest uppercase">
                          Handpicked Styles
                        </span>
                        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
                          {title}
                        </h2>
                        {subtitle ? (
                          <p className="text-brand-muted text-xs sm:text-sm font-sans">{subtitle}</p>
                        ) : null}
                      </div>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-dark hover:text-brand-accent transition-colors"
                      >
                        <span>View Full Catalog</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {featuredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {featuredProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-2xl border border-brand-border/70 p-8">
                        <p className="text-brand-muted text-sm">
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
              );
            }

            case "value_strip": {
              interface TrustItemRaw {
                icon?: string;
                title?: string;
                description?: string;
              }
              const content = (section.content as Record<string, unknown>) || {};
              const rawItems: TrustItemRaw[] = Array.isArray(content.items)
                ? (content.items as TrustItemRaw[])
                : [];
              const items =
                rawItems.length > 0
                  ? rawItems
                  : [
                      {
                        icon: "Truck",
                        title: "Pan-India Delivery",
                        description: "Reliable domestic shipping across all serviceable PIN codes.",
                      },
                      {
                        icon: "RotateCcw",
                        title: "Easy Returns",
                        description: "Hassle-free return and exchange assistance for unworn items.",
                      },
                      {
                        icon: "ShieldCheck",
                        title: "Secure Payments",
                        description: "100% encrypted checkout with UPI, Cards, and Net Banking.",
                      },
                      {
                        icon: "MessageCircle",
                        title: "WhatsApp Support",
                        description: "Direct assistance and sizing guidance on +91 8508643832.",
                      },
                    ];

              return (
                <section key={section.id} className="py-12 sm:py-16 bg-white border-b border-brand-border/60">
                  <Container size="xl">
                    <div
                      className={`grid grid-cols-2 ${
                        items.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                      } gap-6 sm:gap-8`}
                    >
                      {items.map((item, idx) => {
                        const iconKey = item.icon || "Truck";
                        const IconComponent = TRUST_ICON_MAP[iconKey] || Truck;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 p-4 rounded-xl transition-colors hover:bg-brand-cream/40"
                          >
                            <div className="w-12 h-12 rounded-full bg-brand-light/50 border border-brand-gold/30 flex items-center justify-center text-brand-dark shrink-0">
                              <IconComponent className="w-5 h-5 text-brand-accent" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-heading text-base sm:text-lg font-semibold text-brand-dark">
                                {item.title}
                              </h4>
                              <p className="text-brand-muted text-xs font-sans leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Container>
                </section>
              );
            }

            case "newsletter": {
              const content = (section.content as Record<string, unknown>) || {};
              const headline = (content.headline as string) || "Join the Velaash Circle";
              const subtext =
                (content.subtext as string) ||
                "Subscribe to receive updates on new arrivals, seasonal collections, and wardrobe inspiration directly to your inbox.";

              return (
                <section key={section.id} className="py-16 sm:py-24 bg-brand-cream/60">
                  <Container size="md">
                    <div className="rounded-3xl bg-brand-dark border border-brand-accent/25 text-brand-cream p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-64 h-64 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative z-10 max-w-lg mx-auto space-y-3">
                        <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-semibold tracking-widest uppercase">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Stay In Touch</span>
                        </div>

                        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
                          {headline}
                        </h2>

                        <p className="text-brand-cream/75 text-xs sm:text-sm font-sans leading-relaxed">
                          {subtext}
                        </p>

                        <HomepageNewsletter />
                      </div>
                    </div>
                  </Container>
                </section>
              );
            }

            default:
              return null;
          }
        })}
      </div>
    </>
  );
}
