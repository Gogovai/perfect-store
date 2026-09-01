/**
 * Database type definitions matching the existing Supabase schema.
 * These types reflect the actual tables in the ecommerce-marketplace database.
 */

export type UserRole = 'customer' | 'seller' | 'admin';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sellers: {
        Row: {
          id: string;
          user_id: string;
          shop_name: string;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          rating: number;
          followers_count: number;
          products_count: number;
          status: 'pending' | 'active' | 'suspended' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shop_name: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          rating?: number;
          followers_count?: number;
          products_count?: number;
          status?: 'pending' | 'active' | 'suspended' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shop_name?: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          rating?: number;
          followers_count?: number;
          products_count?: number;
          status?: 'pending' | 'active' | 'suspended' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          icon: string | null;
          parent_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          slug: string;
          icon?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          slug?: string;
          icon?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          seller_id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          base_price: number;
          status: 'draft' | 'active' | 'inactive' | 'archived';
          is_active: boolean;
          average_rating: number;
          review_count: number;
          sold_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          base_price: number;
          status?: 'draft' | 'active' | 'inactive' | 'archived';
          is_active?: boolean;
          average_rating?: number;
          review_count?: number;
          sold_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          base_price?: number;
          status?: 'draft' | 'active' | 'inactive' | 'archived';
          is_active?: boolean;
          average_rating?: number;
          review_count?: number;
          sold_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku: string;
          price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          sku?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          reserved: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity?: number;
          reserved?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity?: number;
          reserved?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      variant_inventory: {
        Row: {
          id: string;
          variant_id: string;
          quantity: number;
          reserved: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity?: number;
          reserved?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          quantity?: number;
          reserved?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          region: string;
          postal_code: string | null;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          region: string;
          postal_code?: string | null;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          full_name?: string;
          phone?: string;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          region?: string;
          postal_code?: string | null;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wishlist_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: OrderStatus;
          subtotal: number;
          shipping_cost: number;
          tax: number;
          total: number;
          shipping_address_id: string | null;
          notes: string | null;
          shipping_full_name: string | null;
          shipping_phone: string | null;
          shipping_address_line_1: string | null;
          shipping_address_line_2: string | null;
          shipping_city: string | null;
          shipping_region: string | null;
          shipping_postal_code: string | null;
          shipping_country: string | null;
          delivery_method: string;
          delivery_method_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: OrderStatus;
          subtotal: number;
          shipping_cost?: number;
          tax?: number;
          total: number;
          shipping_address_id?: string | null;
          notes?: string | null;
          shipping_full_name?: string | null;
          shipping_phone?: string | null;
          shipping_address_line_1?: string | null;
          shipping_address_line_2?: string | null;
          shipping_city?: string | null;
          shipping_region?: string | null;
          shipping_postal_code?: string | null;
          shipping_country?: string | null;
          delivery_method?: string;
          delivery_method_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: OrderStatus;
          subtotal?: number;
          shipping_cost?: number;
          tax?: number;
          total?: number;
          shipping_address_id?: string | null;
          notes?: string | null;
          shipping_full_name?: string | null;
          shipping_phone?: string | null;
          shipping_address_line_1?: string | null;
          shipping_address_line_2?: string | null;
          shipping_city?: string | null;
          shipping_region?: string | null;
          shipping_postal_code?: string | null;
          shipping_country?: string | null;
          delivery_method?: string;
          delivery_method_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          seller_id: string;
          product_name: string;
          variant_name: string | null;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          seller_id: string;
          product_name: string;
          variant_name?: string | null;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          seller_id?: string;
          product_name?: string;
          variant_name?: string | null;
          unit_price?: number;
          quantity?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          method: string;
          status: PaymentStatus;
          transaction_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          method: string;
          status?: PaymentStatus;
          transaction_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          method?: string;
          status?: PaymentStatus;
          transaction_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          carrier: string | null;
          tracking_number: string | null;
          status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
          estimated_delivery: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          carrier?: string | null;
          tracking_number?: string | null;
          status?: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
          estimated_delivery?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          carrier?: string | null;
          tracking_number?: string | null;
          status?: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
          estimated_delivery?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          rating: number;
          title: string | null;
          comment: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          rating: number;
          title?: string | null;
          comment?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          rating?: number;
          title?: string | null;
          comment?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          minimum_order: number;
          maximum_discount: number | null;
          usage_limit: number | null;
          usage_count: number;
          seller_id: string | null;
          category_id: string | null;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          minimum_order?: number;
          maximum_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          seller_id?: string | null;
          category_id?: string | null;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: 'percentage' | 'fixed';
          discount_value?: number;
          minimum_order?: number;
          maximum_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          seller_id?: string | null;
          category_id?: string | null;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_coupons: {
        Row: {
          id: string;
          order_id: string;
          coupon_id: string;
          discount_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          coupon_id: string;
          discount_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          coupon_id?: string;
          discount_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      seller_payouts: {
        Row: {
          id: string;
          seller_id: string;
          amount: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}

/**
 * Convenience type for database table rows
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * Profile type derived from database
 */
export type Profile = Tables<'profiles'>;

/**
 * Seller type derived from database
 */
export type SellerRecord = Tables<'sellers'>;

/**
 * Cart types
 */
export type Cart = Tables<'carts'>;
export type CartItemRow = Tables<'cart_items'>;

/**
 * Wishlist types
 */
export type Wishlist = Tables<'wishlists'>;
export type WishlistItemRow = Tables<'wishlist_items'>;

/**
 * Order types
 */
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;

/**
 * Payment types
 */
export type Payment = Tables<'payments'>;

/**
 * Address type
 */
export type Address = Tables<'addresses'>;

/**
 * Shipment types
 */
export type Shipment = Tables<'shipments'>;

/**
 * Coupon types
 */
export type Coupon = Tables<'coupons'>;

/**
 * Order with items - for order detail views
 */
export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

/**
 * Customer order summary - for order history list
 */
export type CustomerOrder = Order & {
  order_items: (OrderItem & {
    products?: {
      product_images?: Array<{ url: string; is_primary: boolean }>;
    };
  })[];
};

/**
 * Seller order item - for seller order views
 */
export type SellerOrderItem = OrderItem & {
  orders: Pick<Order, 'id' | 'order_number' | 'status' | 'created_at' | 'shipping_full_name'>;
};

/**
 * Order creation result
 */
export type OrderCreationResult = {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
};

/**
 * Order status display mapping
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/**
 * Order status step ordering for timeline display
 */
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];
