import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductWithRelations } from '@/lib/queries/products';

interface ProductImageProps {
  product: ProductWithRelations;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function ProductImage({
  product,
  priority = false,
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
}: ProductImageProps) {
  const primaryImage = product.product_images.find((img) => img.is_primary) ||
    product.product_images[0];

  if (!primaryImage) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className={`block relative ${className}`}>
      <Image
        src={primaryImage.url}
        alt={primaryImage.alt_text || product.name}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />
    </Link>
  );
}
