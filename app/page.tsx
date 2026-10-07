import type { Metadata } from "next";
import dynamic from "next/dynamic";
import React from "react";
import {
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
import { BRAND } from "@/lib/constants";
import { getNavigationCategories } from "@/features/navigation";
import { getProducts, type ProductListItem } from "@/features/products";
import { getSiteSettings, getStoreContact } from "@/features/settings";
import { env } from "@/lib/env";

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");
import { getHomepageSections } from "@/features/homepage";
import { HeroCarousel } from "@/components/homepage/hero-carousel";
import { OccasionStrip, type OccasionItem } from "@/components/homepage/occasion-strip";
import { FeaturedProductsShowcase } from "@/components/homepage/featured-products-showcase";
import { BrandStory } from "@/components/homepage/brand-story";
import { ClientTestimonials } from "@/components/homepage/client-testimonials";
import { CategoryVisualGrid } from "@/components/homepage/category-visual-grid";
import type { HeroSlide } from "@/features/admin/types/homepage";

const HomepageNewsletter = dynamic(
  () => import("@/components/homepage/homepage-newsletter").then((mod) => mod.HomepageNewsletter),
  { ssr: true }
);
import { DeferredRecentlyViewedSection } from "@/components/homepage/deferred-recently-viewed-section";

export const revalidate = 300;

// SEO: Generate homepage metadata using dynamic site settings and brand fallbacks
export async function generateMetadata(): Promise<Metadata> {
  const { storeProfile, seoDefaults } = await getSiteSettings();

  const brandName = storeProfile.name || BRAND.name;
  const title =
    seoDefaults.meta_title || `${brandName} — Everyday essentials for every home`;
  const description =
    seoDefaults.meta_description ||
    "Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.";

  const defaultKeywords = [
    brandName,
    storeProfile.legal_name || BRAND.legalName,
    "Everyday essentials",
    "Clothing for men and women",
    "Pooja essentials",
    "Brass essentials",
    "Contemporary Clothing",
    "Kurtas & Sets",
    "ஆடை",
    "கடை",
  ];
  const configuredKeywords = seoDefaults.keywords
    ? seoDefaults.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const keywords = Array.from(new Set([...defaultKeywords, ...configuredKeywords]));

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: brandName,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 630,
          alt: `${brandName} — Everyday essentials for every home`,
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
  const { whatsappNumber, whatsappUrl } = getStoreContact(siteSettings.storeProfile);

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
  // Audit: added logo and sameAs to improve Knowledge Panel eligibility
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteSettings.storeProfile.name || BRAND.name,
    legalName: siteSettings.storeProfile.legal_name || BRAND.legalName,
    url: BASE_URL,
    description:
      siteSettings.seoDefaults.meta_description ||
      "Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.",
    email: siteSettings.storeProfile.email,
    telephone: whatsappNumber,
    ...(siteSettings.storeProfile.logo_url
      ? {
          logo: {
            "@type": "ImageObject",
            url: siteSettings.storeProfile.logo_url,
          },
        }
      : {}),
    sameAs: [
      siteSettings.socialLinks.instagram || BRAND.socialLinks.instagram,
      siteSettings.socialLinks.facebook || BRAND.socialLinks.facebook,
      whatsappUrl,
    ].filter(Boolean),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: whatsappNumber,
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

      <div className="flex flex-col min-h-screen bg-luxury-dots text-brand-dark">
        {/* Render Sections in their Admin-Configured Display Order */}
        {sections.map((section) => {
          switch (section.section_type) {
            case "hero_banner": {
              const content = (section.content as Record<string, unknown>) || {};
              const rawSlides = Array.isArray(content.slides) ? (content.slides as HeroSlide[]) : [];

              const slides = rawSlides.map((slide) => ({
                ...slide,
                tag: slide.tag ?? "",
                headline:
                  slide.headline === "Modern Everyday Luxury"
                    ? "Everyday essentials for every home"
                    : slide.headline ?? "",
                subtitle:
                  typeof slide.subtitle === "string" &&
                  (slide.subtitle.includes("contemporary wardrobe essentials") ||
                    slide.subtitle.includes("Effortless silhouettes"))
                    ? "Clothing for men and women, plus traditional pooja and brass essentials."
                    : slide.subtitle ?? "",
                cta_text: slide.cta_text ?? "",
                cta_link: slide.cta_link ?? "",
                secondary_cta_text: slide.secondary_cta_text ?? "",
                secondary_cta_link: slide.secondary_cta_link ?? "",
                content_width: slide.content_width ?? "balanced",
              }));

              const rawHeadline = (content.headline as string) || "";
              const headline =
                rawHeadline === "Modern Everyday Luxury"
                  ? "Everyday essentials for every home"
                  : rawHeadline;

              const rawSubtitle =
                (content.subtitle as string) || (content.subheading as string) || "";
              const subtitle =
                rawSubtitle.includes("contemporary wardrobe essentials") ||
                rawSubtitle.includes("Effortless silhouettes")
                  ? "Clothing for men and women, plus traditional pooja and brass essentials."
                  : rawSubtitle;

              return (
                <HeroCarousel
                  key={section.id}
                  slides={slides}
                  fallbackHeadline={headline}
                  fallbackSubtitle={subtitle}
                  fallbackCtaText={
                    (content.cta_text as string) || (content.cta_label as string) || ""
                  }
                  fallbackCtaLink={(content.cta_link as string) || ""}
                  fallbackSecondaryText={(content.secondary_cta_text as string) || ""}
                  fallbackSecondaryLink={(content.secondary_cta_link as string) || ""}
                  fallbackBgImage={
                    (content.bg_image as string) ||
                    (content.image_url as string) ||
                    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
                  }
                  fallbackBgImageMobile={
                    (content.bg_image_mobile as string) || ""
                  }
                  fallbackPositionX={
                    typeof content.position_x === "number" ? content.position_x : 50
                  }
                  fallbackPositionY={
                    typeof content.position_y === "number" ? content.position_y : 50
                  }
                  fallbackTextAlign={
                    (content.text_align as "left" | "center" | "right") || "center"
                  }
                  fallbackContentWidth={
                    (content.content_width as "compact" | "balanced" | "wide" | "full") ||
                    "balanced"
                  }
                />
              );
            }

            case "occasion_strip": {
              const content = (section.content as Record<string, unknown>) || {};
              const title = (content.title as string) || "Shop by Occasion";
              const subtitle =
                (content.subtitle as string) ||
                "Thoughtfully curated palettes and cuts styled for life's special celebrations and effortless daily poise.";
              const items = Array.isArray(content.items) ? (content.items as OccasionItem[]) : undefined;

              return (
                <OccasionStrip
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                  items={items}
                />
              );
            }

            case "category_grid": {
              if (categories.length === 0) return null;
              const content = (section.content as Record<string, unknown>) || {};
              const title = (content.title as string) || "Explore by Category";
              const subtitle =
                (content.subtitle as string) || "Thoughtfully tailored pieces across modern everyday silhouettes.";

              return (
                <section key={section.id} className="py-12 sm:py-16 border-b border-brand-border/60 bg-white">
                  <Container size="xl">
                    <CategoryVisualGrid
                      categories={categories}
                      title={title}
                      subtitle={subtitle}
                    />
                  </Container>
                </section>
              );
            }

            case "featured_products": {
              const content = (section.content as Record<string, unknown>) || {};
              const title = (content.title as string) || "Featured Arrivals";
              const subtitle = (content.subtitle as string) || "Handpicked styles from our collection.";

              return (
                <FeaturedProductsShowcase
                  key={section.id}
                  title={title}
                  subtitle={subtitle}
                  products={featuredProducts}
                  showQuickAdd
                  cardSize="medium"
                />
              );
            }

            case "couture_spotlight": {
              const content = (section.content as Record<string, unknown>) || {};
              return (
                <BrandStory
                  key={section.id}
                  tagline={content.tagline as string | undefined}
                  headline={content.headline as string | undefined}
                  description={content.description as string | undefined}
                  imageUrl={content.image_url as string | undefined}
                  detailBadgeTitle={content.detail_badge_title as string | undefined}
                  detailBadgeText={content.detail_badge_text as string | undefined}
                  ctaText={content.cta_text as string | undefined}
                  ctaLink={content.cta_link as string | undefined}
                />
              );
            }

            case "testimonials": {
              const content = (section.content as Record<string, unknown>) || {};
              const rawItems = Array.isArray(content.items)
                ? (content.items as Array<{
                    id?: string;
                    name: string;
                    location?: string;
                    rating?: number;
                    review: string;
                    product_name?: string;
                    productName?: string;
                  }>)
                : undefined;

              return (
                <ClientTestimonials
                  key={section.id}
                  headline={content.headline as string | undefined}
                  subtitle={content.subtitle as string | undefined}
                  items={rawItems}
                />
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
                        title: "Doorstep Replacements",
                        description: "Hassle-free size exchange and replacement assistance for unworn items.",
                      },
                      {
                        icon: "ShieldCheck",
                        title: "Secure Payments",
                        description: "100% encrypted checkout with UPI, Cards, and Net Banking.",
                      },
                      {
                        icon: "MessageCircle",
                        title: "WhatsApp Support",
                        description: "Direct assistance and sizing guidance on WhatsApp.",
                      },
                    ];
              const contactItems = items.map((item) =>
                item.icon === "MessageCircle" || item.title?.toLowerCase().includes("whatsapp")
                  ? {
                      ...item,
                      description: `Direct assistance and sizing guidance on ${whatsappNumber}.`,
                    }
                  : item
              );

              return (
                <section key={section.id} className="py-10 sm:py-14 bg-luxury-dots border-b border-brand-border/60 relative">
                  <Container size="xl">
                    <div className="rounded-2xl border border-brand-border/70 bg-white/95 backdrop-blur-md p-5 sm:p-7 shadow-xs">
                      <div
                        className={`grid grid-cols-2 ${
                          items.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                        } gap-5 sm:gap-6`}
                      >
                        {contactItems.map((item, idx) => {
                          const iconKey = item.icon || "Truck";
                          const IconComponent = TRUST_ICON_MAP[iconKey] || Truck;
                          return (
                            <div
                              key={idx}
                              className="group flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 p-3 rounded-xl transition-all duration-300 hover:bg-brand-cream/60 hover:-translate-y-0.5"
                            >
                              <div className="w-11 h-11 rounded-full bg-brand-light/60 border border-brand-gold/40 flex items-center justify-center text-brand-dark shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                <IconComponent className="w-5 h-5 text-brand-accent" />
                              </div>
                              <div className="space-y-0.5">
                                <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">
                                  {item.title}
                                </h3>
                                <p className="text-brand-muted text-xs font-sans leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
              // Admin-configurable incentive badge (e.g. "Get ₹100 off your first order")
              const incentive =
                (content.incentive as string) || "Get early access to new arrivals & exclusive member offers";

              return (
                <section key={section.id} className="py-16 sm:py-24 bg-luxury-dots-cream relative">
                  <Container size="md">
                    <div className="rounded-3xl bg-brand-dark border border-brand-accent/25 text-brand-cream p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-64 h-64 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative z-10 max-w-lg mx-auto space-y-3">
                        {/* Incentive badge — the conversion hook */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-brand-gold text-[11px] font-semibold tracking-wide">
                          <Sparkles className="w-3 h-3" />
                          <span>{incentive}</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-brand-muted/60 text-[10px] font-semibold tracking-widest uppercase pt-1">
                          <span>Newsletter</span>
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

        {/* Dynamic Personalization: Recently Viewed (only visible to visitors with browsing history) */}
        <DeferredRecentlyViewedSection />
      </div>
    </>
  );
}
