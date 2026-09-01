'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

interface CartButtonProps {
  className?: string;
  onClick?: () => void;
}

export function CartButton({ className = '', onClick }: CartButtonProps) {
  const items = useCartStore((s) => s.items);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <button
      onClick={onClick || toggleDrawer}
      className={`relative p-2 text-gray-600 hover:text-[#0f2b5b] transition-colors ${className}`}
      aria-label={`Shopping cart, ${itemCount} items`}
    >
      <ShoppingCart size={22} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-[#e85d26] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[20px]">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
