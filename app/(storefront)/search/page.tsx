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
import { getPublicSellerOptions } from '@/lib/queries/sellers';
import { APP_NAME } from '@/config/constants';

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

const SORT_VALUES = ['newest', 'price_asc', 'price_desc', 'rating', 'most_reviewed', 'popular'] as const;
type SortValue = (typeof SORT_VALUES)[number];

function parseSort(value: string | undefined): SortValue {
  return SORT_VALUES.includes(value as SortValue) ? (value as SortValue) : 'newest';
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const query = firstParam(sp.q) || '';

  if (!query) return { title: `Search - ${APP_NAME}`, description: `Search products on ${APP_NAME}` };
  return { title: `"${query}" - Search - ${APP_NAME}`, description: `Search results for "${query}" on ${APP_NAME}` };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = firstParam(sp.q) || '';
  const pageValue = Number(firstParam(sp.page));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const category = firstParam(sp.category);
  const seller = firstParam(sp.seller);
  const minPrice = positiveNumber(firstParam(sp.minPrice));
  const maxPrice = positiveNumber(firstParam(sp.maxPrice));
  const ratingValue = positiveNumber(firstParam(sp.rating));
  const rating = ratingValue !== undefined && ratingValue <= 5 ? ratingValue : undefined;
  const sort = parseSort(firstParam(sp.sort));

  const [categories, sellers] = await Promise.all([getCategories(), getPublicSellerOptions()]);
  const filterCategories = categories.map((c) => ({ label: c.name, value: c.slug }));
  const filterSellers = sellers.map((s) => ({ label: s.store_name, value: s.id }));

  let products: Awaited<ReturnType<typeof getProducts>>['products'] = [];
  let total = 0;
  let pageSize = 20;

  if (query.trim()) {
    const result = await getProducts({ search: query, categorySlug: category, sellerId: seller, minPrice, maxPrice, rating, sort, page, pageSize: 20 });
    products = result.products;
    total = result.total;
    pageSize = result.pageSize;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8">
      <Container size="xl">
        <div className="mb-6 max-w-2xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">{query ? 'Search Results' : 'Search'}</h1>
          <SearchBar defaultValue={query} />
        </div>

        {!query ? <SearchEmptyState /> : (
          <div className="flex gap-8">
            <div className="w-64 shrink-0"><ProductFilters categories={filterCategories} sellers={filterSellers} /></div>
            <div className="min-w-0 flex-1">
              <ProductFilters categories={filterCategories} sellers={filterSellers} />
              <SearchResults products={products} query={query} total={total} />
              {totalPages > 1 && <div className="mt-8"><Pagination currentPage={page} totalPages={totalPages} /></div>}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
