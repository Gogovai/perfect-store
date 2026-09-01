import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { CategoryBreadcrumb } from '@/components/categories/CategoryBreadcrumb';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductEmptyState } from '@/components/products/ProductEmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { getCategoryBySlug, getCategoryBreadcrumbs } from '@/lib/queries/categories';
import { getProducts } from '@/lib/queries/products';
import { APP_NAME } from '@/config/constants';


interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - ${APP_NAME}`,
    description: category.description || `Browse ${category.name} products on ${APP_NAME}`,
    openGraph: {
      title: `${category.name} - ${APP_NAME}`,
      description: category.description || `Browse ${category.name} products`,
      type: 'website',
    },
  };
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const breadcrumbs = await getCategoryBreadcrumbs(slug);
  const page = Number(sp.page) || 1;

  const { products, total, pageSize } = await getProducts({
    categorySlug: slug,
    page,
    pageSize: 20,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <CategoryBreadcrumb breadcrumbs={breadcrumbs} />
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-gray-600 max-w-3xl">{category.description}</p>
          )}
        </div>

        {/* Subcategories */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h2>
            <CategoryGrid categories={category.subcategories} size="sm" />
          </div>
        )}

        {/* Products */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Products in {category.name}
            {total > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">({total})</span>
            )}
          </h2>

          {products.length === 0 ? (
            <ProductEmptyState
              title={`No products in ${category.name}`}
              description="No products have been listed in this category yet. Check back soon."
              showBrowseButton
            />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        )}
      </Container>
    </div>
  );
}
