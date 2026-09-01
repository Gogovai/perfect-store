'use client';

import React from 'react';
import { Truck, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatting';
import { DELIVERY_METHODS, FREE_DELIVERY_THRESHOLD } from '@/lib/config/delivery';

interface DeliveryMethodProps {
  selectedMethodId: string;
  onSelectMethod: (methodId: string) => void;
  subtotal: number;
}

export function DeliveryMethod({
  selectedMethodId,
  onSelectMethod,
  subtotal,
}: DeliveryMethodProps) {
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <div className="space-y-3">
      {DELIVERY_METHODS.map((method) => {
        const isSelected = selectedMethodId === method.id;
        const icon = method.id === 'express' ? Zap : Truck;

        return (
          <div
            key={method.id}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-[#0f2b5b] bg-blue-50/50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectMethod(method.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectMethod(method.id);
              }
            }}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-[#0f2b5b] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {React.createElement(icon, { size: 18 })}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </div>
              <div className="text-right">
                {isFreeDelivery ? (
                  <div>
                    <p className="text-sm font-bold text-green-600">Free</p>
                    <p className="text-[10px] text-gray-400 line-through">{formatPrice(method.price)}</p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-gray-900">{formatPrice(method.price)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isFreeDelivery && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          ✓ Your order qualifies for free delivery (over {formatPrice(FREE_DELIVERY_THRESHOLD)})
        </p>
      )}
      {!isFreeDelivery && (
        <p className="text-xs text-gray-500">
          Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery
        </p>
      )}
    </div>
  );
}
