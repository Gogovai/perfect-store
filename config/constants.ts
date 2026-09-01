/**
 * Application-wide constants
 * Re-exports from brand config for convenience
 */

export { APP_NAME, APP_DESCRIPTION } from './brand';

/** URL constants */
export const URLS = {
  HOME: '/',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  CART: '/cart',
  CHECKOUT: '/checkout',
  SELLER: '/seller',
  SELLER_DASHBOARD: '/seller/dashboard',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCOUNT: '/account',
  ORDERS: '/orders',
  WISHLIST: '/wishlist',
  ADDRESSES: '/addresses',
} as const;

/** API constants */
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  ORDERS: '/api/orders',
  USERS: '/api/users',
  SELLERS: '/api/sellers',
  CART: '/api/cart',
  CHECKOUT: '/api/checkout',
} as const;

/** Pagination */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

/** Validation constants */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MIN_PRODUCT_NAME_LENGTH: 5,
  MAX_PRODUCT_NAME_LENGTH: 255,
  MIN_PRODUCT_DESCRIPTION_LENGTH: 20,
  MAX_PRODUCT_DESCRIPTION_LENGTH: 5000,
  MIN_PRICE: 0,
  MAX_PRICE: 999999999,
} as const;

/** File upload constants */
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_IMAGE_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

/** Currency constants */
export const CURRENCY = {
  CODE: 'GHS',
  SYMBOL: '₵',
  NAME: 'Ghanaian Cedi',
} as const;

/** Time constants (in milliseconds) */
export const TIME = {
  ONE_MINUTE: 1000 * 60,
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
  ONE_WEEK: 1000 * 60 * 60 * 24 * 7,
  ONE_MONTH: 1000 * 60 * 60 * 24 * 30,
} as const;

/** Regular expressions */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_GH: /^(\+233|0)?[0-9]{9,15}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
} as const;

/** Status constants */
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;

/** Order status constants */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

/** User role constants */
export const USER_ROLE = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const;

/** Protected route patterns */
export const PROTECTED_ROUTES = {
  CUSTOMER: ['/account', '/orders', '/checkout', '/wishlist', '/addresses'],
  SELLER: ['/seller'],
  ADMIN: ['/admin'],
} as const;

/** Public route patterns */
export const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/categories',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/seller/apply',
] as const;
