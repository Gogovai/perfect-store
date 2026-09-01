/**
 * Common utility functions for the marketplace
 */

/**
 * Format a price value to local currency (GHS)
 */
export function formatPrice(amount: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('en-GH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, length: number = 100, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + suffix;
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Ghana)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Ghana phone numbers: +233, 0, or nothing followed by 9-15 digits
  const phoneRegex = /^(\+233|0)?[0-9]{9,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Delay execution for testing/debugging
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}
