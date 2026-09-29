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
  CatalogBreadcrumbs,
  type BreadcrumbItem,
  type ProductSortOption,
} from "@/features/products";
import { BRAND } from "@/lib/constants";

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
      canonical: `https://velaash.com/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://velaash.com/category/${slug}`,
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
      {/* Breadcrumbs with JSON-LD Schema */}
      <CatalogBreadcrumbs items={breadcrumbItems} />

      {/* Category Header Banner */}
      <div className="border-brand-border/60 space-y-2 border-b pb-6">
        <span className="text-brand-accent text-xs font-semibold tracking-widest uppercase">
          {category.parent_name ? `${category.parent_name} Collection` : "Collection"}
        </span>
        <h1 className="font-heading text-brand-dark text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-brand-dark/70 max-w-2xl text-xs leading-relaxed sm:text-sm">
            {category.description}
          </p>
        )}
      </div>

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
