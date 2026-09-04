'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cancelOrder } from '@/app/account/orders/actions';

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) {
      return;
    }
    setBusy(true);
    setError('');
    const result = await cancelOrder(orderId);
    if (!result.success) {
      setError(result.error || 'Unable to cancel this order. Please try again.');
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-xs text-red-600" role="alert">{error}</p>
      )}
      <Button type="button" variant="danger" fullWidth onClick={handleCancel} disabled={busy}>
        {busy ? 'Cancelling…' : 'Cancel Order'}
      </Button>
      <p className="text-xs text-gray-500 text-center mt-2">
        You can cancel this order while it is pending or confirmed.
      </p>
    </div>
  );
}