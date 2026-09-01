'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CheckoutEmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        <ShoppingBag size={28} className="text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Your cart is empty
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Add some products to your cart before proceeding to checkout.
      </p>
      <Link href="/products">
        <Button>Start Shopping</Button>
      </Link>
    </div>
  );
}
