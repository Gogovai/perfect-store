/**
 * Core type definitions for the marketplace
 * Re-exports database types and provides application-level types
 */

export type {
  Database,
  Profile,
  SellerRecord,
  UserRole,
  Cart,
  CartItemRow,
  Wishlist,
  WishlistItemRow,
  Order,
  OrderItem,
  Payment,
  Address,
  Shipment,
  Coupon,
  Tables,
  TablesInsert,
  TablesUpdate,
  OrderStatus,
  PaymentStatus,
  OrderWithItems,
  CustomerOrder,
  SellerOrderItem,
  OrderCreationResult,
} from './database';

export { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from './database';
