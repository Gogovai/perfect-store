import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function WishlistEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Heart size={36} className="text-gray-300" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Save products you love to your wishlist. Review them anytime and easily move them to your cart.
      </p>
      <Link href="/products">
        <Button>Discover Products</Button>
      </Link>
    </div>
  );
}
