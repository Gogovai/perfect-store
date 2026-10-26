import React from 'react';
import { formatPrice } from '@/lib/utils/formatting';

interface ProductPriceProps {
  price: number;
  compareAtPrice?: number | null;
  variantPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'inline' | 'stacked';
}

export function ProductPrice({
  price,
  compareAtPrice,
  variantPrice,
  size = 'md',
  layout = 'inline',
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

  if (layout === 'stacked') {
    return (
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className={`font-bold leading-tight text-gray-900 ${s.main}`}>
          {formatPrice(currentPrice)}
        </span>
        {hasDiscount && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-gray-400 line-through ${s.compare}`}>
              {formatPrice(compareAtPrice!)}
            </span>
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-600">
              -{discountPercent}%
            </span>
          </div>
        )}
      </div>
    );
  }

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
