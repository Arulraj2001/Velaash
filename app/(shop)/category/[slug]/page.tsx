import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProducts,
  getCategoryBySlug,
  ProductCard,
  ProductFilters,
  ProductFiltersDrawer,
  ActiveFilterChips,
  ProductSort,
  ProductPagination,
  ProductGridEmpty,
  type BreadcrumbItem,
  type ProductSortOption,
} from "@/features/products";
import { Container, PageHeaderBanner } from "@/components/ui";
import { BRAND } from "@/lib/constants";
import { env } from "@/lib/env";

const BASE_URL = (env.NEXT_PUBLIC_APP_URL ?? "https://velaash.in").replace(/\/$/, "");

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Velaash",
    };
  }

  const title = category.seo_title || `${category.name} | Velaash`;
  const description =
    category.seo_description ||
    category.description ||
    `Explore ${category.name.toLowerCase()} at Velaash. Refined style and breathable fabrics.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/category/${slug}`,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedParams = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

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
    category: slug,
    page,
    sort,
    size,
    color,
    minPrice,
    maxPrice,
    inStock,
  });

  // If 0 products found, fetch 4 featured products for empty state suggestions
  const featuredSuggestions =
    products.length === 0
      ? (await getProducts({ limit: 4, sort: "featured" })).products
      : [];

  // Construct Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];

  if (category.parent_name && category.parent_slug) {
    breadcrumbItems.push({
      label: category.parent_name,
      href: `/category/${category.parent_slug}`,
    });
  }

  breadcrumbItems.push({ label: category.name });

  return (
    <div className="space-y-6 font-sans sm:space-y-8">
      {/* 1. Full-Bleed Page Header Banner (Minimal by default; letterbox hero if category has image) */}
      <PageHeaderBanner
        badge={category.parent_name ? `${category.parent_name} Collection` : "Curated Collection"}
        title={category.name}
        description={
          category.description ||
          `Discover contemporary ${category.name.toLowerCase()} thoughtfully designed with refined fabrics, effortless cuts, and everyday grace.`
        }
        imageUrl={category.image_url}
        breadcrumbs={breadcrumbItems}
        extraMeta={
          <span className="inline-block text-xs font-medium text-brand-gold">
            Showing {totalCount} Handcrafted {totalCount === 1 ? "Design" : "Designs"}
          </span>
        }
      />

      <Container size="xl" className="space-y-6 sm:space-y-8">
        {/* Controls Bar */}
        <div className="border-brand-border/40 flex items-center justify-between gap-4 border-b pb-4">
          {/* Mobile Filter Drawer */}
          <ProductFiltersDrawer availableFilters={availableFilters} currentCategorySlug={slug} />

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <ProductSort />
          </div>
        </div>

        {/* Main Catalog Layout */}
        <div className="flex items-start gap-8 lg:gap-10">
          {/* Desktop Filter Sidebar */}
          <aside className="sticky top-24 hidden w-56 shrink-0 md:block lg:w-64">
            <ProductFilters availableFilters={availableFilters} currentCategorySlug={slug} />
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
