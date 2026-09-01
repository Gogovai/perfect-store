import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductEmptyState } from '@/components/products/ProductEmptyState';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Pagination } from '@/components/ui/Pagination';
import { getProducts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { APP_NAME } from '@/config/constants';
export const metadata: Metadata = {
  title: `Products - ${APP_NAME}`,
  description: `Browse all products on ${APP_NAME} marketplace`,
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;

  const page = Number(sp.page) || 1;
  const category = (sp.category as string) || undefined;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const rating = sp.rating ? Number(sp.rating) : undefined;
  const sort = (sp.sort as string) || 'newest';

  const { products, total, pageSize } = await getProducts({
    categorySlug: category,
    minPrice,
    maxPrice,
    rating,
    sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'most_reviewed' | 'popular',
    page,
    pageSize: 20,
  });

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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Products</h1>
          <p className="mt-1 text-gray-600">
            {total > 0 ? `${total.toLocaleString()} products available` : 'Browse our marketplace'}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-64 shrink-0">
            <ProductFilters categories={filterCategories} />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile filters */}
            <ProductFilters categories={filterCategories} />

            {products.length === 0 ? (
              <ProductEmptyState
                title="No products found"
                description="Try adjusting your filters or browse our categories."
              />
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
