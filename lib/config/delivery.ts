/**
 * Delivery method configuration for Ghana.
 * Actual pricing should eventually come from a database or admin config.
 * These are placeholder structures that can be updated later.
 */

export type DeliveryMethodConfig = {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  price: number; // In GHS, using integer-safe values
};

/**
 * Available delivery methods.
 * Prices are indicative and should be replaced with actual rates.
 */
export const DELIVERY_METHODS: DeliveryMethodConfig[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivered within 3-5 business days',
    estimatedDays: '3-5',
    price: 15.00,
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Delivered within 1-2 business days',
    estimatedDays: '1-2',
    price: 35.00,
  },
];

/**
 * Free delivery threshold in GHS
 */
export const FREE_DELIVERY_THRESHOLD = 200.00;

/**
 * Get delivery price for a given method
 */
export function getDeliveryPrice(methodId: string): number {
  const method = DELIVERY_METHODS.find((m) => m.id === methodId);
  return method?.price ?? 0;
}
