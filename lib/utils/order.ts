/**
 * Order utility functions.
 */

/**
 * Generate a unique order number.
 * Format: PS-{YYYYMMDD}-{RANDOM}
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PS-${dateStr}-${random}`;
}
