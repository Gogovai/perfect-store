'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { AddressSelector } from '@/components/checkout/AddressSelector';
import { DeliveryMethod } from '@/components/checkout/DeliveryMethod';
import { CheckoutItems } from '@/components/checkout/CheckoutItems';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { PaymentPlaceholder } from '@/components/checkout/PaymentPlaceholder';
import { CheckoutValidationAlert } from '@/components/checkout/CheckoutValidationAlert';
import { CheckoutEmptyState } from '@/components/checkout/CheckoutEmptyState';
import { validateCheckout, type CheckoutSummary as CheckoutSummaryType } from './actions';
import { placeOrder } from '@/app/account/orders/actions';
import { Truck, MapPin, Package } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('standard');
  const [checkoutData, setCheckoutData] = useState<CheckoutSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  // Load checkout on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await validateCheckout(selectedDeliveryMethod);
        if (!cancelled) setCheckoutData(data);
      } catch {
        // Failed to load
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when delivery method changes
  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    async function reload() {
      const data = await validateCheckout(selectedDeliveryMethod);
      if (!cancelled) setCheckoutData(data);
    }
    reload();
    return () => { cancelled = true; };
  }, [selectedDeliveryMethod, isLoading]);

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setOrderError('Please select a delivery address');
      return;
    }

    // Prevent double-submission
    if (isProcessing) return;

    setIsProcessing(true);
    setOrderError(null);

    try {
      const result = await placeOrder(selectedAddressId, selectedDeliveryMethod, notes || undefined);

      if (result.success && result.orderId) {
        // Clear the Zustand cart state on successful order
        // The server-side cart was already cleared by the database function
        try {
          const { useCartStore } = await import('@/stores/cart');
          useCartStore.getState().clearCart();
        } catch {
          // Cart store import failed, but order was created successfully
        }

        // Redirect to order confirmation page
        router.push(`/account/orders/${result.orderId}/success`);
      } else {
        setOrderError(result.error || 'We couldn\'t create your order. Please try again.');
      }
    } catch {
      setOrderError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
        <Container size="xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
          </div>
        </Container>
      </div>
    );
  }

  if (!checkoutData || checkoutData.items.length === 0) {
    return (
      <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
        <Container size="xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          </div>
          <CheckoutEmptyState />
        </Container>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your order and complete checkout
          </p>
        </div>

        <CheckoutValidationAlert warnings={checkoutData.warnings} />

        {/* Order Error Alert */}
        {orderError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">{orderError}</p>
                <p className="text-xs text-red-600 mt-1">
                  If this keeps happening, please try again later.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-[#0f2b5b] text-white flex items-center justify-center">
                  <MapPin size={14} />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Delivery Address</h2>
              </div>
              <AddressSelector
                selectedAddressId={selectedAddressId}
                onSelectAddress={setSelectedAddressId}
              />
            </section>

            {/* Delivery Method */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-[#0f2b5b] text-white flex items-center justify-center">
                  <Truck size={14} />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Delivery Method</h2>
              </div>
              <DeliveryMethod
                selectedMethodId={selectedDeliveryMethod}
                onSelectMethod={setSelectedDeliveryMethod}
                subtotal={checkoutData.subtotal}
              />
            </section>

            {/* Order Items */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-[#0f2b5b] text-white flex items-center justify-center">
                  <Package size={14} />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  Order Items ({checkoutData.itemCount})
                </h2>
              </div>
              <CheckoutItems items={checkoutData.validItems} />
            </section>

            {/* Payment */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <PaymentPlaceholder />
            </section>

            {/* Order Notes */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Order Notes (Optional)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                maxLength={500}
              />
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CheckoutSummary
                itemCount={checkoutData.itemCount}
                subtotal={checkoutData.subtotal}
                shippingCost={checkoutData.shippingCost}
                total={checkoutData.total}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                isDisabled={!selectedAddressId || checkoutData.invalidItems.length > 0 || isProcessing}
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
