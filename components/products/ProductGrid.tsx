import React from 'react';
import { ProductCard } from './ProductCard';
import type { ProductWithRelations } from '@/lib/queries/products';

interface ProductGridProps {
  products: ProductWithRelations[];
  priority?: boolean;
}

export function ProductGrid({ products, priority = false }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={priority && index < 4}
        />
      ))}
    </div>
  );
}
