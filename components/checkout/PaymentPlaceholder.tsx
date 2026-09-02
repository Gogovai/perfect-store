'use client';

import { CreditCard, Banknote } from 'lucide-react';

export type PaymentMethod = 'cash_on_delivery' | 'paystack';

export function PaymentPlaceholder({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  const methods = [
    ['cash_on_delivery', 'Cash on Delivery', 'Pay when your order arrives.', Banknote],
    ['paystack', 'Card / Mobile Money', 'Secure online payment powered by Paystack.', CreditCard],
  ] as const;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Payment Method</h3>
      <div className="space-y-2">
        {methods.map(([id, name, desc, Icon]) => (
          <label
            key={id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
              value === id ? 'border-[#0f2b5b] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <Icon size={19} className="text-[#0f2b5b]" />
            <div>
              <p className="text-sm font-medium text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
