import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getOrderDetail, cancelOrder } from '@/app/account/orders/actions';
import { formatPrice, formatDate } from '@/lib/utils/formatting';
import { getStatusStepIndex, getStatusMessage } from '@/lib/utils/order';
import type { OrderStatus } from '@/types/database';

function getStatusBadgeVariant(status: OrderStatus): 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary' {
  switch (status) {
    case 'pending': return 'warning';
    case 'confirmed': return 'primary';
    case 'processing': return 'secondary';
    case 'shipped': return 'primary';
    case 'delivered': return 'success';
    case 'cancelled': return 'danger';
    case 'refunded': return 'danger';
    default: return 'default';
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    case 'refunded': return 'Refunded';
    default: return status;
  }
}

const STATUS_TIMELINE: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const result = await getOrderDetail(id);

  if (!result.success || !result.order) notFound();

  const order = result.order;
  const currentStepIndex = getStatusStepIndex(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="lg">
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order {order.order_number}</h1>
            <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.created_at, 'long')}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)} className="self-start sm:self-auto">{getStatusLabel(order.status)}</Badge>
        </div>

        <div className={`p-4 rounded-xl mb-6 ${isCancelled ? 'bg-red-50 border border-red-200' : order.status === 'delivered' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm font-medium ${isCancelled ? 'text-red-800' : order.status === 'delivered' ? 'text-green-800' : 'text-blue-800'}`}>{getStatusMessage(order.status)}</p>
          {order.status === 'pending' && <p className="text-xs text-red-600 mt-1">Payment processing will be available soon. Your order is currently pending confirmation.</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isCancelled && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Order Status</h2>
                  <div className="relative">
                    {STATUS_TIMELINE.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const isLast = index === STATUS_TIMELINE.length - 1;
                      return (
                        <div key={step.status} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-[#0f2b5b] text-white' : 'bg-gray-200 text-gray-500'} ${isCurrent ? 'ring-2 ring-blue-200' : ''}`}><StepIcon size={14} /></div>
                            {!isLast && <div className={`w-0.5 h-8 ${index < currentStepIndex ? 'bg-[#0f2b5b]' : 'bg-gray-200'}`} />}
                          </div>
                          <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                            <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {isCancelled && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"><XCircle size={20} className="text-red-600" /></div>
                    <div><p className="text-sm font-semibold text-gray-900">Order Cancelled</p><p className="text-xs text-gray-500">This order has been cancelled.</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Items ({order.items.length})</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                        {item.image_url ? <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="64px" /> : <div className="flex items-center justify-center h-full"><Package size={20} className="text-gray-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                        {item.variant_name && <p className="text-xs text-gray-500 mt-0.5">{item.variant_name}</p>}
                        {item.seller_name && <p className="text-xs text-gray-500 mt-0.5">Seller: {item.seller_name}</p>}
                        <div className="flex items-center justify-between mt-1"><span className="text-xs text-gray-500">{formatPrice(item.unit_price)} × {item.quantity}</span><span className="text-sm font-semibold text-gray-900">{formatPrice(item.subtotal)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><MapPin size={18} className="text-gray-500" /><h2 className="text-base font-semibold text-gray-900">Delivery</h2></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500 mb-1">Recipient</p><p className="text-sm font-medium text-gray-900">{order.shipping_full_name || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Phone</p><p className="text-sm font-medium text-gray-900">{order.shipping_phone || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Region</p><p className="text-sm font-medium text-gray-900">{order.shipping_region || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">City</p><p className="text-sm font-medium text-gray-900">{order.shipping_city || 'N/A'}</p></div>
                  <div className="sm:col-span-2"><p className="text-xs text-gray-500 mb-1">Address</p><p className="text-sm font-medium text-gray-900">{order.shipping_address_line_1 || 'N/A'}{order.shipping_address_line_2 && `, ${order.shipping_address_line_2}`}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Country</p><p className="text-sm font-medium text-gray-900">{order.shipping_country || 'Ghana'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Delivery Method</p><p className="text-sm font-medium text-gray-900">{order.delivery_method_name}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Delivery</span><span className={`font-medium ${order.shipping_cost === 0 ? 'text-green-600' : 'text-gray-900'}`}>{order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}</span></div>
                  {order.tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-medium text-gray-900">{formatPrice(order.tax)}</span></div>}
                  <div className="border-t border-gray-200 pt-3"><div className="flex justify-between"><span className="text-base font-semibold text-gray-900">Total</span><span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span></div></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3"><CreditCard size={18} className="text-gray-500" /><h2 className="text-base font-semibold text-gray-900">Payment</h2></div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-sm font-medium text-amber-800">{order.payment?.status === 'pending' ? 'Payment: Pending' : order.payment?.status || 'Pending'}</p><p className="text-xs text-amber-600 mt-1">Payment processing will be available soon.</p></div>
              </CardContent>
            </Card>

            {(order.status === 'pending' || order.status === 'confirmed') && (
              <Card>
                <CardContent className="p-5">
                  <form action={async () => { 'use server'; await cancelOrder(order.id); }}>
                    <Button type="submit" variant="danger" fullWidth>Cancel Order</Button>
                    <p className="text-xs text-gray-500 text-center mt-2">You can cancel this order while it is pending or confirmed.</p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
