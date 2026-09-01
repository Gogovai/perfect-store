import React from 'react';
import { CategoryCard } from './CategoryCard';
import type { Category } from '@/lib/queries/categories';

interface CategoryGridProps {
  categories: Category[];
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryGrid({ categories, size = 'md' }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} size={size} />
      ))}
    </div>
  );
}
