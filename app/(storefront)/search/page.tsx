import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Pagination } from '@/components/ui/Pagination';
import { getProducts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { APP_NAME } from '@/config/constants';
interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const query = (sp.q as string) || '';

  if (!query) {
    return {
      title: `Search - ${APP_NAME}`,
      description: `Search products on ${APP_NAME}`,
    };
  }

  return {
    title: `"${query}" - Search - ${APP_NAME}`,
    description: `Search results for "${query}" on ${APP_NAME}`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;

  const query = (sp.q as string) || '';
  const page = Number(sp.page) || 1;
  const category = (sp.category as string) || undefined;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const rating = sp.rating ? Number(sp.rating) : undefined;
  const sort = (sp.sort as string) || 'newest';

  let products: Awaited<ReturnType<typeof getProducts>>['products'] = [];
  let total = 0;
  let pageSize = 20;

  if (query) {
    const result = await getProducts({
      search: query,
      categorySlug: category,
      minPrice,
      maxPrice,
      rating,
      sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'most_reviewed' | 'popular',
      page,
      pageSize: 20,
    });
    products = result.products;
    total = result.total;
    pageSize = result.pageSize;
  }

  const totalPages = Math.ceil(total / pageSize);

  // Get categories for filter sidebar
  const categories = await getCategories();
  const filterCategories = categories.map((c) => ({
    label: c.name,
    value: c.slug,
  }));

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        {/* Search Header */}
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {query ? `Search Results` : 'Search'}
          </h1>
          <SearchBar defaultValue={query} />
        </div>

        {!query ? (
          <SearchEmptyState />
        ) : (
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <div className="w-64 shrink-0">
              <ProductFilters categories={filterCategories} />
            </div>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Mobile filters */}
              <ProductFilters categories={filterCategories} />

              <SearchResults products={products} query={query} total={total} />

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
