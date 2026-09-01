'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/stores/wishlist';
import { toggleWishlistItem } from '@/app/(storefront)/wishlist/actions';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  price: number;
  imageUrl: string;
  slug: string;
  sellerName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  price,
  imageUrl,
  slug,
  sellerName,
  size = 'md',
  className = '',
}: WishlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toggleItem, hasItem } = useWishlistStore();
  const isInWishlist = hasItem(productId);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = { sm: 14, md: 16, lg: 18 };

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      const result = await toggleWishlistItem(productId);

      if (result.success) {
        toggleItem({
          productId,
          name: productName,
          price,
          imageUrl,
          slug,
          sellerName,
        });
      } else if (result.error === 'Not authenticated') {
        router.push(`/login?redirect=/products/${slug}`);
      }
    } catch {
      // Optimistic toggle on network error
      toggleItem({
        productId,
        name: productName,
        price,
        imageUrl,
        slug,
        sellerName,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110 disabled:opacity-50 ${
        isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      } ${className}`}
      aria-label={isInWishlist ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
    >
      <Heart
        size={iconSizes[size]}
        className={isInWishlist ? 'fill-current' : ''}
      />
    </button>
  );
}
