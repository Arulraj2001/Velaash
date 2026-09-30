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
  CatalogBreadcrumbs,
  type ProductSortOption,
} from "@/features/products";
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

  const { products, totalCount, totalPages, availableFilters } = await getProducts({
    page,
    sort,
    size,
    color,
    minPrice,
    maxPrice,
    inStock,
  });

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Shop All" }];

  return (
    <div className="space-y-6 font-sans sm:space-y-8">
      {/* Breadcrumbs Navigation */}
      <CatalogBreadcrumbs items={breadcrumbItems} />

      {/* Header Banner */}
      <div className="border-brand-border/60 space-y-2 border-b pb-6">
        <span className="text-brand-accent text-xs font-semibold tracking-widest uppercase">
          Curated Catalog
        </span>
        <h1 className="font-heading text-brand-dark text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Shop All Collections
        </h1>
        <p className="text-brand-muted max-w-2xl text-xs leading-relaxed sm:text-sm">
          Contemporary silhouettes, breathable handpicked fabrics, and effortless style crafted for
          your modern everyday and occasion wardrobe.
        </p>
      </div>

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
            <ProductGridEmpty />
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
    </div>
  );
}
