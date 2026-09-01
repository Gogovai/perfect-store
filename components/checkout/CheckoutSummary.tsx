'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatting';
import { Button } from '@/components/ui/Button';

interface CheckoutSummaryProps {
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  onPlaceOrder: () => void;
  isProcessing?: boolean;
  isDisabled?: boolean;
}

export function CheckoutSummary({
  itemCount,
  subtotal,
  shippingCost,
  total,
  onPlaceOrder,
  isProcessing = false,
  isDisabled = false,
}: CheckoutSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Notice */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          Payment integration will be available at the next checkout stage.
          Possible future methods: Mobile Money, Card, Bank Transfer.
        </p>
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-4"
        onClick={onPlaceOrder}
        disabled={isDisabled || isProcessing}
        isLoading={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Place Order'}
      </Button>

      {/* Trust indicators */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Shield size={14} />
        <span>Secure checkout powered by Perfect Store</span>
      </div>
    </div>
  );
}
