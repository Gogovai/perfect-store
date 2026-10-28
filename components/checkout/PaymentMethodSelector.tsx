'use client';

import { CreditCard } from 'lucide-react';

export type PaymentMethod = 'paystack';

export function PaymentMethodSelector({
  value,
  onChange,
  paystackAvailable,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  paystackAvailable: boolean;
}) {
  const methods = [
    ['paystack', 'Mobile Money / Card', 'Pay securely with Paystack using Mobile Money or a debit/credit card.', CreditCard],
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
      {!paystackAvailable && <p className="mt-2 text-xs text-gray-500">Mobile Money and card payments are temporarily unavailable while secure payment setup is completed. Please try again later.</p>}
    </div>
  );
}
