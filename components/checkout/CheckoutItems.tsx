'use client';

import React from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/formatting';
import type { ValidatedCartItem } from '@/app/(storefront)/checkout/actions';

interface CheckoutItemsProps {
  items: ValidatedCartItem[];
}

export function CheckoutItems({ items }: CheckoutItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex gap-3 p-3 rounded-lg border ${
            item.isValid
              ? 'border-gray-100 bg-white'
              : 'border-red-200 bg-red-50/50'
          }`}
        >
          {/* Image */}
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300 text-xs">
                No img
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {item.productName}
            </p>
            {item.variantName && (
              <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
            )}
            {!item.isValid && item.validationError && (
              <p className="text-xs text-red-600 mt-1 font-medium">{item.validationError}</p>
            )}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
              <span className={`text-sm font-semibold ${item.isValid ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
