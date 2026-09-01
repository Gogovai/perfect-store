'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartEmptyState } from './CartEmptyState';
import { useCartStore } from '@/stores/cart';

export function CartDrawer() {
  const { items, isOpen, closeDrawer, updateQuantity, removeItem } = useCartStore();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-gray-900" />
            <h2 className="text-lg font-semibold text-gray-900">
              Cart ({itemCount})
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <CartEmptyState />
          ) : (
            <div className="px-5">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <CartSummary itemCount={itemCount} subtotal={subtotal} showCheckout={false} />
            <div className="flex gap-3">
              <Link href="/cart" className="flex-1" onClick={closeDrawer}>
                <Button variant="outline" fullWidth>View Cart</Button>
              </Link>
              <Link href="/checkout" className="flex-1" onClick={closeDrawer}>
                <Button fullWidth>Checkout</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
