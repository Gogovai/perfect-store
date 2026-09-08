import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle, Package, Truck, MapPin, CreditCard, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getOrderDetail } from '@/app/account/orders/actions';
import { formatPrice, formatDate } from '@/lib/utils/formatting';

interface OrderSuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { id } = await params;
  const result = await getOrderDetail(id);

  if (!result.success || !result.order) {
    notFound();
  }

  const order = result.order;

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="lg">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Order Received!
            </h1>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Your order has been placed successfully. We&apos;ll process it shortly.
            </p>
          </div>

          {/* Order Info Card */}
          <Card>
            <CardContent className="p-6">
              {/* Order Number & Date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="text-lg font-bold text-gray-900">{order.order_number}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-500">Order Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at, 'long')}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`mb-6 p-3 rounded-lg border ${
                order.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                order.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm font-medium ${
                  order.status === 'confirmed' ? 'text-green-800' :
                  order.status === 'pending' ? 'text-amber-800' :
                  'text-blue-800'
                }`}>
                  Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                </p>
                <p className={`text-xs mt-1 ${
                  order.status === 'confirmed' ? 'text-green-600' :
                  order.status === 'pending' ? 'text-amber-600' :
                  'text-blue-600'
                }`}>
                  {order.status === 'confirmed'
                    ? 'Your order has been confirmed and payment received.'
                    : order.status === 'pending'
                    ? 'Your order has been received and is awaiting confirmation.'
                    : `Your order is currently ${order.status.replace(/_/g, ' ')}.`}
                </p>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Items Ordered</h2>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package size={18} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {item.product_name}
                        </p>
                        {item.variant_name && (
                          <p className="text-xs text-gray-500">{item.variant_name}</p>
                        )}
                        {item.seller_name && (
                          <p className="text-xs text-gray-500">Seller: {item.seller_name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.subtotal)}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery ({order.delivery_method_name})</span>
                    <span className={order.shipping_cost === 0 ? 'text-green-600 font-medium' : ''}>
                      {order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}
                    </span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatPrice(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Delivery Address</h2>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-900">{order.shipping_full_name || 'N/A'}</p>
                  <p>{order.shipping_phone || 'N/A'}</p>
                  <p>
                    {order.shipping_address_line_1 || 'N/A'}
                    {order.shipping_address_line_2 && `, ${order.shipping_address_line_2}`}
                  </p>
                  <p>
                    {order.shipping_city || ''}{order.shipping_city && order.shipping_region ? ', ' : ''}{order.shipping_region || ''}
                    {order.shipping_postal_code ? ` ${order.shipping_postal_code}` : ''}
                  </p>
                  <p>{order.shipping_country || 'Ghana'}</p>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={16} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
                </div>
                {order.payment?.status === 'paid' ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Payment Confirmed</p>
                    <p className="text-xs text-green-600 mt-1">
                      Your payment of {formatPrice(order.payment.amount)} via {order.payment.method} has been confirmed.
                    </p>
                  </div>
                ) : order.payment?.status === 'processing' ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Payment Processing</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your payment is being processed. You will receive confirmation shortly.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800">Payment: {order.payment?.status ? order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1) : 'Pending'}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      {!order.payment ? 'Payment method not set. You can pay from the order details page.' : 'Your order is being processed.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Method */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={16} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Delivery Method</h2>
                </div>
                <p className="text-sm text-gray-600">{order.delivery_method_name}</p>
              </div>

              {/* Order Notes */}
              {order.notes && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">Order Notes</h2>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href={`/account/orders/${order.id}`} className="flex-1">
              <Button fullWidth variant="outline">
                View Order Details
              </Button>
            </Link>
            <Link href="/products" className="flex-1">
              <Button fullWidth>
                Continue Shopping
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
