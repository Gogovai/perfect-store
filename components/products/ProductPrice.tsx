import React from 'react';
import { formatPrice } from '@/lib/utils/formatting';

interface ProductPriceProps {
  price: number;
  compareAtPrice?: number | null;
  variantPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductPrice({
  price,
  compareAtPrice,
  variantPrice,
  size = 'md',
}: ProductPriceProps) {
  const currentPrice = variantPrice ?? price;
  const hasDiscount = compareAtPrice !== null && compareAtPrice !== undefined && compareAtPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice! - currentPrice) / compareAtPrice!) * 100)
    : 0;

  const sizeClasses = {
    sm: { main: 'text-sm', compare: 'text-xs' },
    md: { main: 'text-lg', compare: 'text-sm' },
    lg: { main: 'text-2xl', compare: 'text-base' },
  };

  const s = sizeClasses[size];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`font-bold text-gray-900 ${s.main}`}>
        {formatPrice(currentPrice)}
      </span>
      {hasDiscount && (
        <>
          <span className={`text-gray-400 line-through ${s.compare}`}>
            {formatPrice(compareAtPrice!)}
          </span>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
