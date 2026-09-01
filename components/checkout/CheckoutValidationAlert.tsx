'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface CheckoutValidationAlertProps {
  warnings: string[];
}

export function CheckoutValidationAlert({ warnings }: CheckoutValidationAlertProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800">
            Some items need attention
          </h3>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning, i) => (
              <li key={i} className="text-xs text-amber-700">
                • {warning}
              </li>
            ))}
          </ul>
          <Link href="/cart" className="inline-block mt-3">
            <Button variant="outline" size="sm">
              Review Cart
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
