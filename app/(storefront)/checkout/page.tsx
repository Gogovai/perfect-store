'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { AddressSelector } from '@/components/checkout/AddressSelector';
import { DeliveryMethod } from '@/components/checkout/DeliveryMethod';
import { CheckoutItems } from '@/components/checkout/CheckoutItems';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { PaymentPlaceholder, type PaymentMethod } from '@/components/checkout/PaymentPlaceholder';
import { CheckoutValidationAlert } from '@/components/checkout/CheckoutValidationAlert';
import { CheckoutEmptyState } from '@/components/checkout/CheckoutEmptyState';
import { validateCheckout, type CheckoutSummary as CheckoutSummaryType } from '@/app/(storefront)/checkout/actions';
import { placeOrder } from '@/app/account/orders/actions';
import { setPaymentMethod } from '@/app/account/orders/payment-actions';
import { Truck, MapPin, Package } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('standard');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [checkoutData, setCheckoutData] = useState<CheckoutSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await validateCheckout(selectedDeliveryMethod);
        if (!cancelled) setCheckoutData(data);
      } catch {
        if (!cancelled) setCheckoutData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    async function reload() {
      try {
        const data = await validateCheckout(selectedDeliveryMethod);
        if (!cancelled) setCheckoutData(data);
      } catch {
        if (!cancelled) setOrderError('Unable to refresh checkout totals. Please try again.');
      }
    }
    reload();
    return () => { cancelled = true; };
  }, [selectedDeliveryMethod, isLoading]);

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setOrderError('Please select a delivery address');
      return;
    }
    if (!checkoutData || checkoutData.invalidItems.length > 0) {
      setOrderError('Please review your cart before placing the order.');
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    setOrderError(null);

    try {
      const result = await placeOrder(selectedAddressId, selectedDeliveryMethod, notes || undefined);

      if (!result.success || !result.orderId) {
        setOrderError(result.error || "We couldn't create your order. Please try again.");
        return;
      }

      const paymentResult = await setPaymentMethod({
        orderId: result.orderId,
        method: selectedPaymentMethod,
      });

      if (!paymentResult.success) {
        setOrderError(paymentResult.error || 'Your order was created, but we could not save the payment method. Please open the order and try again.');
        return;
      }

      try {
        const { useCartStore } = await import('@/stores/cart');
        useCartStore.getState().clearCart();
      } catch {
        // Server cart has already been cleared by create_order.
      }

      if (selectedPaymentMethod === 'paystack') {
        const response = await fetch('/api/payments/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: result.orderId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.authorization_url) {
          setOrderError(data.error || 'Online payment is currently unavailable. Your order was saved; you can retry payment from the order page.');
          return;
        }
        window.location.assign(data.authorization_url);
        return;
      }

      router.push(`/account/orders/${result.orderId}/success`);
    } catch {
      setOrderError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8">
        <Container size="xl">
          <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />)}</div>
            <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
          </div>
        </Container>
      </div>
    );
  }

  if (!checkoutData || checkoutData.items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8">
        <Container size="xl">
          <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1></div>
          <CheckoutEmptyState />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8">
      <Container size="xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1>
          <p className="mt-1 text-sm text-gray-500">Review your order and complete checkout</p>
        </div>

        <CheckoutValidationAlert warnings={checkoutData.warnings} />

        {orderError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
            <p className="text-sm font-medium text-red-800">{orderError}</p>
            <p className="mt-1 text-xs text-red-600">If this keeps happening, please try again later.</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2b5b] text-white"><MapPin size={14} /></div><h2 className="text-base font-semibold text-gray-900">Delivery Address</h2></div>
              <AddressSelector selectedAddressId={selectedAddressId} onSelectAddress={setSelectedAddressId} />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2b5b] text-white"><Truck size={14} /></div><h2 className="text-base font-semibold text-gray-900">Delivery Method</h2></div>
              <DeliveryMethod selectedMethodId={selectedDeliveryMethod} onSelectMethod={setSelectedDeliveryMethod} subtotal={checkoutData.subtotal} />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2b5b] text-white"><Package size={14} /></div><h2 className="text-base font-semibold text-gray-900">Order Items ({checkoutData.itemCount})</h2></div>
              <CheckoutItems items={checkoutData.validItems} />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <PaymentPlaceholder value={selectedPaymentMethod} onChange={setSelectedPaymentMethod} />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Order Notes (Optional)</h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions for your order..." className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} maxLength={500} />
              <p className="mt-1 text-right text-xs text-gray-400">{notes.length}/500</p>
            </section>
          </div>

          <div className="lg:col-span-1"><div className="sticky top-24">
            <CheckoutSummary itemCount={checkoutData.itemCount} subtotal={checkoutData.subtotal} shippingCost={checkoutData.shippingCost} total={checkoutData.total} onPlaceOrder={handlePlaceOrder} isProcessing={isProcessing} isDisabled={!selectedAddressId || checkoutData.invalidItems.length > 0 || isProcessing} />
          </div></div>
        </div>
      </Container>
    </div>
  );
}
