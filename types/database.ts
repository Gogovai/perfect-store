export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type UserRole = 'customer' | 'seller' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'paystack' | 'cash_on_delivery' | 'bank_transfer';
export type ProductStatus = 'draft' | 'pending_review' | 'active' | 'inactive' | 'rejected';
export type SellerStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type ShipmentStatus = 'pending' | 'packed' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';

type Table<Row = Record<string, unknown>, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Array<Record<string, unknown>>;
};

type TablesMap = {
  profiles: Table<{ id: string; email: string | null; first_name: string | null; last_name: string | null; phone: string | null; avatar_url: string | null; role: UserRole; is_active: boolean; created_at: string; updated_at: string }>;
  sellers: Table<{ id: string; owner_id: string; store_name: string; slug: string; description: string | null; logo_url: string | null; banner_url: string | null; phone: string | null; email: string | null; status: SellerStatus; commission_rate: number; created_at: string; updated_at: string }>;
  categories: Table<{ id: string; parent_id: string | null; name: string; slug: string; description: string | null; image_url: string | null; is_active: boolean; sort_order: number; created_at: string; updated_at: string }>;
  products: Table<{ id: string; seller_id: string; category_id: string | null; name: string; slug: string; description: string | null; short_description: string | null; sku: string | null; brand: string | null; status: ProductStatus; base_price: number; compare_at_price: number | null; cost_price: number | null; currency: string; weight_grams: number | null; is_featured: boolean; rating_average: number; review_count: number; created_at: string; updated_at: string }>;
  product_images: Table<{ id: string; product_id: string; url: string; alt_text: string | null; sort_order: number; is_primary: boolean; created_at: string }>;
  product_variants: Table<{ id: string; product_id: string; name: string; sku: string | null; price: number | null; compare_at_price: number | null; attributes: Json; image_url: string | null; is_active: boolean; created_at: string; updated_at: string }>;
  inventory: Table<{ id: string; product_id: string; quantity: number; reserved_quantity: number; low_stock_threshold: number; updated_at: string }>;
  variant_inventory: Table<{ id: string; variant_id: string; quantity: number; reserved_quantity: number; low_stock_threshold: number; updated_at: string }>;
  addresses: Table<{ id: string; user_id: string; label: string; recipient_name: string; phone: string; address_line1: string; address_line2: string | null; city: string; region: string; country: string; postal_code: string | null; delivery_instructions: string | null; is_default: boolean; created_at: string; updated_at: string }>;
  carts: Table<{ id: string; user_id: string | null; session_id: string | null; currency: string; created_at: string; updated_at: string }>;
  cart_items: Table<{ id: string; cart_id: string; product_id: string; variant_id: string | null; quantity: number; unit_price: number; created_at: string; updated_at: string }>;
  wishlists: Table<{ id: string; user_id: string; created_at: string; updated_at: string }>;
  wishlist_items: Table<{ id: string; wishlist_id: string; product_id: string; created_at: string }>;
  orders: Table<{ id: string; order_number: string; customer_id: string; status: OrderStatus; currency: string; subtotal: number; shipping_fee: number; discount_amount: number; total_amount: number; shipping_address: Json; delivery_method: string; delivery_method_name: string; notes: string | null; placed_at: string; created_at: string; updated_at: string }>;
  order_items: Table<{ id: string; order_id: string; seller_id: string; product_id: string; variant_id: string | null; product_name: string; sku: string | null; quantity: number; unit_price: number; total_price: number; created_at: string }>;
  payments: Table<{ id: string; order_id: string; provider: PaymentMethod; provider_reference: string | null; status: PaymentStatus; amount: number; currency: string; paid_at: string | null; metadata: Json; created_at: string; updated_at: string }>;
  shipments: Table<{ id: string; order_id: string; status: ShipmentStatus; tracking_number: string | null; carrier: string | null; shipped_at: string | null; delivered_at: string | null; created_at: string; updated_at: string }>;
  reviews: Table<{ id: string; product_id: string; customer_id: string; rating: number; title: string; body: string | null; order_item_id: string | null; is_verified_purchase: boolean; is_published: boolean; created_at: string; updated_at: string }>;
  coupons: Table<{ id: string; code: string; description: string | null; discount_type: string; discount_value: number; max_uses: number | null; current_uses: number; valid_from: string; valid_until: string | null; is_active: boolean; created_at: string; updated_at: string }>;
  order_coupons: Table<{ id: string; order_id: string; coupon_id: string; discount_amount: number; created_at: string }>;
  seller_payouts: Table<{ id: string; seller_id: string; amount: number; status: string; transaction_id: string | null; payout_date: string | null; created_at: string; updated_at: string }>;
  notifications: Table<{ id: string; user_id: string; type: string; title: string; message: string; data: Json; is_read: boolean; created_at: string }>;
  audit_logs: Table<{ id: string; user_id: string; action: string; entity_type: string; entity_id: string; changes: Json; ip_address: string | null; user_agent: string | null; created_at: string }>;
};

export type Database = {
  public: {
    Tables: TablesMap;
    Views: Record<string, never>;
    Functions: {
      create_order: { Args: { p_address_id: string; p_delivery_method: string; p_notes?: string | null }; Returns: Json };
      cancel_order: { Args: { p_order_id: string }; Returns: Json };
    };
    Enums: { user_role: UserRole; seller_status: SellerStatus; product_status: ProductStatus; order_status: OrderStatus; payment_method: PaymentMethod; payment_status: PaymentStatus; shipment_status: ShipmentStatus };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

export type Review = Tables<'reviews'>;
export type Profile = Tables<'profiles'>;
export type SellerRecord = Tables<'sellers'>;
export type Cart = Tables<'carts'>;
export type CartItemRow = Tables<'cart_items'>;
export type Wishlist = Tables<'wishlists'>;
export type WishlistItemRow = Tables<'wishlist_items'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Payment = Tables<'payments'>;
/** Address type with computed alias fields populated by server actions. */
export type Address = Tables<'addresses'> & { full_name: string; address_line_1: string };
export type Shipment = Tables<'shipments'>;
export type Coupon = Tables<'coupons'>;
export type OrderWithItems = Order & { items: OrderItem[] };
export type CustomerOrder = OrderWithItems;
export type SellerOrderItem = OrderItem;
export type OrderCreationResult = { success: boolean; order_id?: string; order_number?: string; error?: string };

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};
export const ORDER_STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export const Constants = { public: { Enums: {
  user_role: ['customer', 'seller', 'admin'], seller_status: ['pending', 'active', 'suspended', 'rejected'],
  product_status: ['draft', 'pending_review', 'active', 'inactive', 'rejected'], order_status: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
  payment_method: ['paystack', 'cash_on_delivery', 'bank_transfer'], payment_status: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
  shipment_status: ['pending', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
} } } as const;
