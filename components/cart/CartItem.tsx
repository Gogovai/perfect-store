'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatting';
import type { CartItem as CartItemType } from '@/stores/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  compact?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onRemove, compact = false }: CartItemProps) {
  return (
    <div className={`flex gap-3 ${compact ? 'py-3' : 'py-4 border-b border-gray-100 last:border-0'}`}>
      {/* Image */}
      <Link href={`/products/${item.productId}`} className="shrink-0">
        <div className={`${compact ? 'h-16 w-16' : 'h-20 w-20'} rounded-lg overflow-hidden bg-gray-100 relative`}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes={compact ? '64px' : '80px'}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs">No img</div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.productId}`}
          className="text-sm font-medium text-gray-900 hover:text-[#0f2b5b] transition-colors line-clamp-1"
        >
          {item.name}
        </Link>

        {item.variantName && (
          <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
        )}

        <p className="text-xs text-gray-400 mt-0.5">{item.sellerName}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Price */}
          <span className="text-sm font-bold text-gray-900">{formatPrice(item.price)}</span>

          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              disabled={item.quantity >= (item.maxQuantity || 99)}
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => onRemove(item.id)}
              className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
