'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartEmptyState } from '@/components/cart/CartEmptyState';
import { useCartStore, type CartItem as CartItemType } from '@/stores/cart';
import { getUserCartWithItems, updateCartItemQuantity, removeFromDatabaseCart, type DatabaseCartItem } from './actions';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const [dbItems, setDbItems] = useState<DatabaseCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    items: guestItems,
    updateQuantity: updateGuestQuantity,
    removeItem: removeGuestItem,
  } = useCartStore();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const items = await getUserCartWithItems();
        if (cancelled) return;
        if (items.length > 0) {
          setIsAuthenticated(true);
          setDbItems(items);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const displayItems = isAuthenticated ? dbItems : guestItems;
  const itemCount = displayItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = displayItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleUpdateQuantity(itemId: string, quantity: number) {
    if (isAuthenticated) {
      setDbItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
            : item
        )
      );
      await updateCartItemQuantity(itemId, quantity);
    } else {
      updateGuestQuantity(itemId, quantity);
    }
  }

  async function handleRemove(itemId: string) {
    if (isAuthenticated) {
      setDbItems((prev) => prev.filter((item) => item.id !== itemId));
      await removeFromDatabaseCart(itemId);
    } else {
      removeGuestItem(itemId);
    }
  }

  function toCartItem(item: DatabaseCartItem): CartItemType {
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      variantName: item.variantName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      sellerName: item.sellerName,
      sellerId: item.sellerId,
      maxQuantity: item.maxQuantity,
    };
  }

  if (isLoading) {
    return (
      <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
        <Container size="xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-20 w-20 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-4 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-48 bg-white rounded-xl border border-gray-200 animate-pulse" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        <div className="mb-6 flex items-center gap-3">
          <ShoppingCart size={24} className="text-[#0f2b5b]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Shopping Cart
              {itemCount > 0 && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </h1>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                {displayItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={isAuthenticated ? toCartItem(item as DatabaseCartItem) : item as CartItemType}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mt-4 transition-colors"
              >
                <ArrowLeft size={16} />
                Continue Shopping
              </Link>

              {!isAuthenticated && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <Link href="/login" className="font-semibold underline">Sign in</Link>
                    {' '}to save your cart and sync across devices.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartSummary itemCount={itemCount} subtotal={subtotal} />
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
