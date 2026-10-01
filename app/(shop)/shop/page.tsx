import type { Metadata } from "next";
import {
  getProducts,
  ProductCard,
  ProductFilters,
  ProductFiltersDrawer,
  ActiveFilterChips,
  ProductSort,
  ProductPagination,
  ProductGridEmpty,
  type ProductSortOption,
} from "@/features/products";
import { Container, PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings";
import { BRAND } from "@/lib/constants";
import { env } from "@/lib/env";

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Shop All Collections | Velaash",
  description:
    "Explore the complete Velaash catalog. Discover refined everyday kurtas, dresses, versatile co-ord sets, and relaxed loungewear.",
  alternates: {
    canonical: `${BASE_URL}/shop`,
  },
  openGraph: {
    title: "Shop All Collections | Velaash",
    description: "Refined everyday luxury and contemporary clothing by Velaash.",
    url: `${BASE_URL}/shop`,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
  },
};

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;

  const toArray = (val: string | string[] | undefined): string[] | undefined => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  };

  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;
  const sort = (resolvedParams.sort as ProductSortOption) || "featured";
  const size = toArray(resolvedParams.size);
  const color = toArray(resolvedParams.color);
  const minPrice = resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined;
  const inStock = resolvedParams.inStock === "true";
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;

  const { products, totalCount, totalPages, availableFilters } = await getProducts({
    page,
    sort,
    size,
    color,
    minPrice,
    maxPrice,
    inStock,
    search,
  });

  // If 0 products found, fetch 4 featured products for empty state suggestions
  const featuredSuggestions =
    products.length === 0
      ? (await getProducts({ limit: 4, sort: "featured" })).products
      : [];

  const siteSettings = await getSiteSettings();
  const shopBanner = siteSettings.pageBanners?.shop;
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Shop All" }];

  return (
    <div className="space-y-6 font-sans sm:space-y-8">
      {/* 1. Full-Bleed Page Header Banner (Minimal by default; letterbox hero if image configured) */}
      <PageHeaderBanner
        badge="Curated Catalog"
        title={shopBanner?.headline?.trim() || "Shop All Collections"}
        description={
          shopBanner?.subtitle?.trim() ||
          "Contemporary silhouettes, breathable handpicked fabrics, and effortless style crafted for your modern everyday and festive occasion wardrobe."
        }
        imageUrl={shopBanner?.image_url}
        breadcrumbs={breadcrumbItems}
        extraMeta={
          <span className="inline-block text-xs font-medium text-brand-gold">
            Showing {totalCount} Handcrafted {totalCount === 1 ? "Design" : "Designs"}
          </span>
        }
      />

      <Container size="xl" className="space-y-6 sm:space-y-8">
        {/* Controls Bar (Mobile Filter Drawer Trigger + Sort Dropdown) */}
        <div className="border-brand-border/40 flex items-center justify-between gap-4 border-b pb-4">
          {/* Mobile Filter Drawer Trigger */}
          <ProductFiltersDrawer availableFilters={availableFilters} />

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <ProductSort />
          </div>
        </div>

        {/* Main Catalog Layout */}
        <div className="flex items-start gap-8 lg:gap-10">
          {/* Desktop Filter Sidebar */}
          <aside className="sticky top-24 hidden w-56 shrink-0 md:block lg:w-64">
            <ProductFilters availableFilters={availableFilters} />
          </aside>

          {/* Product Grid Area */}
          <main className="min-w-0 flex-1">
            {/* Active Filter Chips */}
            <ActiveFilterChips totalCount={totalCount} />

            {/* Grid or Empty State */}
            {products.length === 0 ? (
              <ProductGridEmpty featuredProducts={featuredSuggestions} />
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, idx) => (
                    <ProductCard key={product.id} product={product} priority={idx < 4} />
                  ))}
                </div>

                {/* URL-based Server-rendered Pagination */}
                <ProductPagination currentPage={page} totalPages={totalPages} />
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
