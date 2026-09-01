import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils/formatting';
import { Shield, Truck, ArrowRight } from 'lucide-react';

interface CartSummaryProps {
  itemCount: number;
  subtotal: number;
  showCheckout?: boolean;
}

export function CartSummary({ itemCount, subtotal, showCheckout = true }: CartSummaryProps) {
  const shipping = subtotal >= 200 ? 0 : 15;
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className={`font-medium ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </span>
        </div>

        {shipping > 0 && (
          <p className="text-xs text-gray-500">
            Free shipping on orders over {formatPrice(200)}
          </p>
        )}

        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
        </div>
      </div>

      {showCheckout && (
        <>
          <Link href="/checkout" className="block mt-4">
            <Button fullWidth size="lg" disabled={itemCount === 0}>
              Proceed to Checkout <ArrowRight size={18} />
            </Button>
          </Link>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield size={14} className="text-green-500 shrink-0" />
              <span>Secure checkout with buyer protection</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Truck size={14} className="text-blue-500 shrink-0" />
              <span>Free delivery on orders over {formatPrice(200)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
