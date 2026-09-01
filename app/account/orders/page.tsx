import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Package, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getOrderHistory } from '@/app/account/orders/actions';
import { formatPrice, formatDate } from '@/lib/utils/formatting';
import type { OrderStatus } from '@/types/database';

function getStatusBadgeVariant(status: OrderStatus): 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'primary';
    case 'processing':
      return 'secondary';
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'refunded':
      return 'danger';
    default:
      return 'default';
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

export default async function OrderHistoryPage() {
  const result = await getOrderHistory();

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="lg">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-1 text-gray-600">View and track your orders</p>
        </div>

        {!result.success || !result.orders ? (
          /* Error State */
          <Card>
            <CardContent className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load orders
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {result.error || 'Something went wrong. Please try again.'}
              </p>
              <Link href="/account">
                <Button>Back to Account</Button>
              </Link>
            </CardContent>
          </Card>
        ) : result.orders.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <ShoppingBag size={28} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                When you place an order, it will appear here. Start shopping to see your orders.
              </p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Order List */
          <div className="space-y-4">
            {result.orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="block group">
                <Card hoverable>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Product Image */}
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                        {order.first_item_image ? (
                          <Image
                            src={order.first_item_image}
                            alt={order.first_item_name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {order.order_number}
                          </span>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>

                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                          {order.first_item_name && ` — ${order.first_item_name}`}
                          {order.item_count > 1 && ` +${order.item_count - 1} more`}
                        </p>
                      </div>

                      {/* Total and Arrow */}
                      <div className="flex items-center gap-3 sm:flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-gray-400 group-hover:text-blue-500 transition-colors shrink-0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
