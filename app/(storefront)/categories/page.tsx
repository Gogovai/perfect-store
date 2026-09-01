import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { getCategories } from '@/lib/queries/categories';

export const metadata: Metadata = {
  title: 'Categories - Perfect Store',
  description: 'Browse all product categories on Perfect Store marketplace',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Categories</h1>
          <p className="mt-2 text-gray-600">
            Browse our wide selection of product categories
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No categories available at the moment.</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon for updates.</p>
          </div>
        ) : (
          <CategoryGrid categories={categories} size="lg" />
        )}
      </Container>
    </div>
  );
}
