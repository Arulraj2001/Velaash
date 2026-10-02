import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductDetailView } from "@/features/products/components/product-detail-view";
import { getProductBySlug } from "@/features/products/queries/get-product-by-slug";
import { getRelatedProducts } from "@/features/products/queries/get-related-products";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { BRAND } from "@/lib/constants";
import { env } from "@/lib/env";

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Velaash",
      description: "The requested item could not be found.",
    };
  }

  const title = product.seo_title || `${product.name} | Velaash`;
  const description =
    product.seo_description ||
    product.description ||
    `${product.name} - Everyday essentials by Velaash.`;

  const primaryImage = product.images[0]?.image_url || `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    keywords:
      product.seo_keywords && product.seo_keywords.length > 0
        ? product.seo_keywords
        : [
            product.name,
            product.category_name || "Clothing",
            "Contemporary Fashion",
            "Contemporary Clothing",
            "Velaash",
            "VELAASH TRADER'S",
          ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/products/${product.slug}`,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 1067,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // If slug doesn't match any active product, render 404
  if (!product) {
    notFound();
  }

  // Concurrently fetch related products and site settings
  const [relatedProducts, siteSettings] = await Promise.all([
    getRelatedProducts(product.id, product.category_id, 4),
    getSiteSettings(),
  ]);

  // JSON-LD Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.images.map((img) => img.image_url),
    sku: product.variants[0]?.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.base_price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock_status === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: BRAND.legalName,
        url: BASE_URL,
        description: BRAND.description,
      },
    },
    ...(product.rating && product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      {/* Schema.org Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-brand-cream/40 min-h-screen py-8 sm:py-12">
        <Container size="xl">
          {/* Interactive PDP View (Gallery, Sizing, Cart Actions, Accordion, Reviews) */}
          <ProductDetailView
            product={product}
            freeShippingThreshold={siteSettings.shippingPolicy.free_shipping_threshold}
            returnWindowDays={siteSettings.returnsPolicy.return_window_days}
            whatsappNumber={siteSettings.storeProfile.whatsapp_number}
          />

          {/* Related Products ("You May Also Like") Section */}
          {relatedProducts.length > 0 && (
            <section className="border-brand-border/70 mt-16 border-t pt-12 font-sans sm:mt-24 sm:pt-16">
              <div className="space-y-8">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
                    Curated Complements
                  </span>
                  <h2 className="font-heading text-brand-dark text-2xl font-semibold sm:text-3xl">
                    You May Also Like
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {relatedProducts.map((relProduct) => (
                    <ProductCard key={relProduct.id} product={relProduct} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </Container>
      </div>
    </>
  );
}
