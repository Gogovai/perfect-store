import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { CategoryBreadcrumb } from '@/components/categories/CategoryBreadcrumb';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { CategoryVisual } from '@/components/categories/CategoryVisual';
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
  if (!category) return { title: 'Category Not Found' };
  return { title: `${category.name} - ${APP_NAME}`, description: category.description || `Browse ${category.name} products on ${APP_NAME}`, openGraph: { title: `${category.name} - ${APP_NAME}`, description: category.description || `Browse ${category.name} products`, type: 'website' } };
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const breadcrumbs = await getCategoryBreadcrumbs(slug);
  const page = Number(sp.page) || 1;
  const { products, total, pageSize } = await getProducts({ categorySlug: slug, page, pageSize: 20 });
  const totalPages = Math.ceil(total / pageSize);

  return <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8"><Container size="xl">
    <div className="mb-6"><CategoryBreadcrumb breadcrumbs={breadcrumbs} /></div>
    <div className="mb-8 grid gap-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[1.35fr_.65fr] sm:p-6">
      <div className="flex flex-col justify-center"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e85d26]">Shop the category</p><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{category.name}</h1>{category.description && <p className="mt-2 max-w-3xl text-gray-600">{category.description}</p>}</div>
      <CategoryVisual slug={slug} className="min-h-48" />
    </div>
    {category.subcategories && category.subcategories.length > 0 && <div className="mb-8"><h2 className="mb-4 text-lg font-semibold text-gray-900">Subcategories</h2><CategoryGrid categories={category.subcategories} size="sm" /></div>}
    <div className="mb-8"><h2 className="mb-4 text-lg font-semibold text-gray-900">Products in {category.name}{total > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({total})</span>}</h2>{products.length === 0 ? <div className="space-y-5"><ProductEmptyState title={`No products in ${category.name}`} description="No products have been listed in this category yet. Check back soon." showBrowseButton /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><CategoryVisual slug={slug} /><CategoryVisual slug={category.parent_id ? 'home-kitchen' : 'electronics'} /><CategoryVisual slug="fashion" /><CategoryVisual slug="beauty-personal-care" /></div></div> : <ProductGrid products={products} />}</div>
    {totalPages > 1 && <div className="mt-8"><Pagination currentPage={page} totalPages={totalPages} /></div>}
  </Container></div>;
}
