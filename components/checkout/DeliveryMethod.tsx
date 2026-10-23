'use client';

import { Truck, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatting';
import type { DeliveryOption } from '@/lib/config/delivery';

interface DeliveryMethodProps {
  options: DeliveryOption[];
  selectedMethodId: string;
  onSelectMethod: (methodId: string) => void;
  addressSelected: boolean;
}

export function DeliveryMethod({ options, selectedMethodId, onSelectMethod, addressSelected }: DeliveryMethodProps) {
  if (!addressSelected) {
    return <p className="text-sm text-gray-500">Select a delivery address to see the available delivery methods and prices.</p>;
  }

  if (options.length === 0) {
    return <p className="text-sm text-amber-700">No delivery rate is configured for this address yet. Please contact the store before placing your order.</p>;
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
      {options.map((option) => {
        const selected = selectedMethodId === option.id;
        const Icon = option.id.includes('express') ? Zap : Truck;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onSelectMethod(option.id)}
            role="radio"
            aria-checked={selected}
            className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${selected ? 'border-[#0f2b5b] bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-[#0f2b5b] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{option.name}</span>
                  <span className="mt-1 block text-xs text-gray-500">{option.description}</span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-gray-900">{formatPrice(option.price)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
