'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { WishlistEmptyState } from '@/components/wishlist/WishlistEmptyState';
import { ProductRating } from '@/components/products/ProductRating';
import { useWishlistStore } from '@/stores/wishlist';
import { useCartStore } from '@/stores/cart';
import { getUserWishlistItems, removeFromWishlist, type WishlistItemWithProduct } from './actions';
import { formatPrice } from '@/lib/utils/formatting';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';

export default function WishlistPage() {
  const [dbItems, setDbItems] = useState<WishlistItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { items: guestItems, removeItem: removeGuestItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const items = await getUserWishlistItems();
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
  const hasItems = displayItems.length > 0;

  async function handleRemove(productId: string) {
    if (isAuthenticated) {
      await removeFromWishlist(productId);
      setDbItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      removeGuestItem(productId);
    }
  }

  function handleAddToCart(item: { productId: string; name: string; price: number; imageUrl: string; slug: string; sellerName: string }) {
    addItem({
      productId: item.productId,
      variantId: null,
      name: item.name,
      variantName: null,
      price: item.price,
      imageUrl: item.imageUrl,
      sellerName: item.sellerName || '',
      sellerId: '',
      maxQuantity: 99,
      quantity: 1,
    });
  }

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        <div className="mb-6 flex items-center gap-3">
          <Heart size={24} className="text-red-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Wishlist
              {hasItems && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({displayItems.length} {displayItems.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasItems ? (
          <WishlistEmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayItems.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-200"
              >
                <Link href={`/products/${item.slug || item.productId}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3 sm:p-4">
                  {'sellerName' in item && item.sellerName && (
                    <p className="text-[11px] text-gray-400 mb-1">{item.sellerName}</p>
                  )}
                  <Link href={`/products/${item.slug || item.productId}`} className="block">
                    <h3 className="text-[13px] sm:text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug">
                      {item.name}
                    </h3>
                  </Link>

                  {'averageRating' in item && typeof item.averageRating === 'number' && (
                    <div className="mb-2">
                      <ProductRating
                        rating={item.averageRating}
                        reviewCount={'reviewCount' in item ? (item.reviewCount as number) : 0}
                        size="sm"
                      />
                    </div>
                  )}

                  <p className="text-sm font-bold text-gray-900 mb-3">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0f2b5b] text-white text-xs font-medium rounded-lg hover:bg-[#1a3d7c] transition-colors"
                    >
                      <ShoppingCart size={12} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="px-3 py-2 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasItems && (
          <div className="mt-8 text-center">
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
