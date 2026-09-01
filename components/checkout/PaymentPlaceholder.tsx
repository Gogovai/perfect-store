'use client';

import React from 'react';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';

export function PaymentPlaceholder() {
  const futureMethods = [
    {
      icon: Smartphone,
      name: 'Mobile Money',
      description: 'MTN MoMo, Vodafone Cash, AirtelTigo Money',
      available: false,
    },
    {
      icon: CreditCard,
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard',
      available: false,
    },
    {
      icon: Building2,
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      available: false,
    },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>

      <div className="space-y-2">
        {futureMethods.map((method) => (
          <div
            key={method.name}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
          >
            <method.icon size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">{method.name}</p>
              <p className="text-xs text-gray-500">{method.description}</p>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full uppercase font-medium shrink-0">
              Coming Soon
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500 text-center">
        Payment integration will be available in the next phase.
      </p>
    </div>
  );
}
