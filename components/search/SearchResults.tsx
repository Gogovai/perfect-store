import React from 'react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductEmptyState } from '@/components/products/ProductEmptyState';
import type { ProductWithRelations } from '@/lib/queries/products';

interface SearchResultsProps {
  products: ProductWithRelations[];
  query: string;
  total: number;
}

export function SearchResults({ products, query, total }: SearchResultsProps) {
  if (products.length === 0) {
    return (
      <ProductEmptyState
        title={`No results for "${query}"`}
        description="Try different keywords or check your spelling."
        showBrowseButton
      />
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        {total.toLocaleString()} {total === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
      </p>
      <ProductGrid products={products} />
    </div>
  );
}
