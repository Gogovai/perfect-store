import React from 'react';
import { ProductGrid } from '@/components/products/ProductGrid';
import type { ProductWithRelations } from '@/lib/queries/products';

interface WishlistGridProps {
  products: ProductWithRelations[];
}

export function WishlistGrid({ products }: WishlistGridProps) {
  if (products.length === 0) return null;

  return <ProductGrid products={products} />;
}
