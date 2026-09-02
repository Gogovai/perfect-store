import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { CategoryVisual } from '@/components/categories/CategoryVisual';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Pagination } from '@/components/ui/Pagination';
import { getProducts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { getPublicSellerOptions } from '@/lib/queries/sellers';
import { APP_NAME } from '@/config/constants';
import Link from 'next/link';

export const metadata: Metadata = { title: `Products - ${APP_NAME}`, description: `Browse all products on ${APP_NAME} marketplace` };

interface ProductsPageProps { searchParams: Promise<Record<string, string | string[] | undefined>>; }

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const pageValue = Number(firstParam(sp.page));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const category = firstParam(sp.category);
  const seller = firstParam(sp.seller);
  const minPrice = positiveNumber(firstParam(sp.minPrice));
  const maxPrice = positiveNumber(firstParam(sp.maxPrice));
  const ratingValue = positiveNumber(firstParam(sp.rating));
  const rating = ratingValue !== undefined && ratingValue <= 5 ? ratingValue : undefined;
  const sort = firstParam(sp.sort) || 'newest';

  const [result, categories, sellers] = await Promise.all([
    getProducts({
      categorySlug: category,
      sellerId: seller,
      minPrice,
      maxPrice,
      rating,
      sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'most_reviewed' | 'popular',
      page,
      pageSize: 20,
    }),
    getCategories(),
    getPublicSellerOptions(),
  ]);

  const { products, total, pageSize } = result;
  const totalPages = Math.ceil(total / pageSize);
  const filterCategories = categories.map((c) => ({ label: c.name, value: c.slug }));
  const filterSellers = sellers.map((s) => ({ label: s.store_name, value: s.id }));

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8">
      <Container size="xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">All Products</h1>
          <p className="mt-1 text-gray-600">{total > 0 ? `${total.toLocaleString()} products available` : 'Browse our marketplace'}</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <div className="hidden w-64 shrink-0 lg:block">
            <ProductFilters categories={filterCategories} sellers={filterSellers} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Mobile filters */}
            <div className="mb-4 lg:hidden">
              <ProductFilters categories={filterCategories} sellers={filterSellers} />
            </div>

            {products.length === 0 ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
                  <p className="text-lg font-semibold text-gray-900">No products found</p>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or browse our categories.</p>
                </div>
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Explore Categories</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.slice(0, 12).map((cat) => (
                      <Link key={cat.id} href={`/categories/${cat.slug}`} className="group">
                        <CategoryVisual slug={cat.slug} />
                        <p className="mt-2 text-sm font-semibold text-gray-700 group-hover:text-[#0f2b5b]">{cat.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination currentPage={page} totalPages={totalPages} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
