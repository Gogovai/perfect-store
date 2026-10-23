'use client';

import { useState } from 'react';
import { CreditCard, LoaderCircle } from 'lucide-react';

export function RetryHubtelPaymentButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retryPayment() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/hubtel/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const result: unknown = await response.json().catch(() => null);
      const data = result && typeof result === 'object' ? result as { checkout_url?: unknown; already_paid?: unknown; error?: unknown } : {};
      if (response.ok && data.already_paid) {
        window.location.assign(`/account/orders/${orderId}?payment=confirmed`);
        return;
      }
      if (!response.ok || typeof data.checkout_url !== 'string' || !data.checkout_url.startsWith('https://')) {
        setError(typeof data.error === 'string' ? data.error : 'We could not restart payment. Please try again.');
        return;
      }
      window.location.assign(data.checkout_url);
    } catch {
      setError('Connection problem. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={retryPayment}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f2b5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173c78] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {loading ? 'Connecting to Hubtel…' : 'Retry payment with Hubtel'}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
