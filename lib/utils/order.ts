/**
 * Order utility functions.
 */

import type { OrderStatus } from '@/types/database';

/**
 * Generate a unique order number.
 * Format: PS-{YYYYMMDD}-{RANDOM}
 *
 * Note: This is used as a fallback. The database create_order function
 * generates the order number and enforces uniqueness via a unique constraint.
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PS-${dateStr}-${random}`;
}

/**
 * Get the status step index for timeline display.
 * Returns the index of the current status in the ordered steps array,
 * or -1 for cancelled/refunded statuses.
 */
export function getStatusStepIndex(status: OrderStatus): number {
  const steps: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  return steps.indexOf(status);
}

/**
 * Check if an order can be cancelled by a customer.
 * Only pending and confirmed orders can be cancelled.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

/**
 * Get a human-readable status message for the customer.
 */
export function getStatusMessage(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Your order has been received and is awaiting confirmation.';
    case 'confirmed':
      return 'Your order has been confirmed and will be processed soon.';
    case 'processing':
      return 'Your order is being prepared for shipment.';
    case 'shipped':
      return 'Your order has been shipped and is on its way.';
    case 'delivered':
      return 'Your order has been delivered successfully.';
    case 'cancelled':
      return 'This order has been cancelled.';
    case 'refunded':
      return 'This order has been refunded.';
    default:
      return 'Order status unknown.';
  }
}
