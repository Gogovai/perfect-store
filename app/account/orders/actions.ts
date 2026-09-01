'use server';

/**
 * Order server actions.
 * Handles order creation, history, detail, and cancellation.
 *
 * SECURITY: All operations verify user ownership through authenticated user.
 * The create_order PostgreSQL function handles atomicity and inventory reservation.
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { OrderStatus } from '@/types/database';

// ============================================================
// Validation schemas
// ============================================================

const placeOrderSchema = z.object({
  addressId: z.string().uuid('Invalid address'),
  deliveryMethod: z.enum(['standard', 'express'], {
    errorMap: () => ({ message: 'Invalid delivery method' }),
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

const cancelOrderSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

// ============================================================
// Types
// ============================================================

export type PlaceOrderResult = {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
};

export type OrderListItem = {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  delivery_method: string;
  delivery_method_name: string;
  created_at: string;
  updated_at: string;
  item_count: number;
  first_item_name: string;
  first_item_image: string | null;
};

export type OrderDetailData = {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  notes: string | null;
  delivery_method: string;
  delivery_method_name: string;
  shipping_full_name: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_address_line_2: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    unit_price: number;
    quantity: number;
    subtotal: number;
    product_id: string;
    seller_id: string;
    image_url: string | null;
    seller_name: string | null;
  }>;
  payment: {
    method: string;
    status: string;
    amount: number;
  } | null;
};

// ============================================================
// Place Order
// ============================================================

/**
 * Place an order atomically using the create_order PostgreSQL function.
 * The function handles: validation, price calculation, order creation,
 * order item creation, payment record creation, inventory reservation,
 * and cart cleanup - all within a single database transaction.
 */
export async function placeOrder(
  addressId: string,
  deliveryMethod: string,
  notes?: string
): Promise<PlaceOrderResult> {
  // Validate inputs
  const validation = placeOrderSchema.safeParse({ addressId, deliveryMethod, notes });
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Invalid input' };
  }

  const supabase = await createClient();

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Please log in to continue checkout.' };
  }

  // Call the atomic database function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('create_order', {
    p_user_id: user.id,
    p_address_id: validation.data.addressId,
    p_delivery_method: validation.data.deliveryMethod,
    p_notes: validation.data.notes || null,
  });

  if (error) {
    // Parse the error message for user-friendly display
    const errorMessage = error.message || 'We couldn\'t create your order. Please try again.';

    // Map common database errors to friendly messages
    if (errorMessage.includes('cart is empty')) {
      return { success: false, error: 'Your cart is empty. Please add items before checkout.' };
    }
    if (errorMessage.includes('no longer available')) {
      return { success: false, error: 'One or more items in your cart are no longer available. Please review your cart.' };
    }
    if (errorMessage.includes('Insufficient stock')) {
      return { success: false, error: 'There is not enough stock for one or more items. Please update quantities.' };
    }
    if (errorMessage.includes('delivery address')) {
      return { success: false, error: 'The selected delivery address is no longer available.' };
    }
    if (errorMessage.includes('Invalid delivery method')) {
      return { success: false, error: 'Invalid delivery method selected.' };
    }
    if (errorMessage.includes('unique order number')) {
      return { success: false, error: 'A temporary error occurred. Please try again.' };
    }

    return { success: false, error: 'We couldn\'t create your order. Please try again.' };
  }

  // Check the result
  if (data && typeof data === 'object' && data.success) {
    return {
      success: true,
      orderId: data.order_id,
      orderNumber: data.order_number,
    };
  }

  return { success: false, error: 'We couldn\'t create your order. Please try again.' };
}

// ============================================================
// Get Order History
// ============================================================

/**
 * Get the authenticated user's order history.
 * Returns orders sorted by newest first with item counts and first item info.
 */
export async function getOrderHistory(): Promise<{
  success: boolean;
  orders?: OrderListItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get orders for this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders, error } = await (supabase as any)
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      subtotal,
      shipping_cost,
      tax,
      total,
      delivery_method,
      delivery_method_name,
      created_at,
      updated_at,
      order_items (
        id,
        product_name,
        products (
          product_images (url, is_primary)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !orders) {
    return { success: false, error: 'Failed to load order history' };
  }

  // Transform to OrderListItem format
  const orderListItems: OrderListItem[] = orders.map((order: Record<string, unknown>) => {
    const items = order.order_items as Array<Record<string, unknown>> | null;
    const itemCount = items?.length || 0;

    // Get first item name and image
    let firstItemName = '';
    let firstItemImage: string | null = null;

    if (items && items.length > 0) {
      firstItemName = items[0].product_name as string;
      const product = items[0].products as Record<string, unknown> | null;
      if (product) {
        const images = product.product_images as Array<{ url: string; is_primary: boolean }> | null;
        if (images && images.length > 0) {
          const primary = images.find((img) => img.is_primary) || images[0];
          firstItemImage = primary.url;
        }
      }
    }

    return {
      id: order.id as string,
      order_number: order.order_number as string,
      status: order.status as OrderStatus,
      subtotal: order.subtotal as number,
      shipping_cost: order.shipping_cost as number,
      tax: order.tax as number,
      total: order.total as number,
      delivery_method: order.delivery_method as string,
      delivery_method_name: order.delivery_method_name as string,
      created_at: order.created_at as string,
      updated_at: order.updated_at as string,
      item_count: itemCount,
      first_item_name: firstItemName,
      first_item_image: firstItemImage,
    };
  });

  return { success: true, orders: orderListItems };
}

// ============================================================
// Get Order Detail
// ============================================================

/**
 * Get detailed order information for a specific order.
 * Enforces ownership - users can only view their own orders.
 */
export async function getOrderDetail(
  orderId: string
): Promise<{
  success: boolean;
  order?: OrderDetailData;
  error?: string;
}> {
  // Validate input
  if (!orderId || typeof orderId !== 'string') {
    return { success: false, error: 'Invalid order ID' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get order with ownership check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error } = await (supabase as any)
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      subtotal,
      shipping_cost,
      tax,
      total,
      notes,
      delivery_method,
      delivery_method_name,
      shipping_full_name,
      shipping_phone,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_city,
      shipping_region,
      shipping_postal_code,
      shipping_country,
      created_at,
      updated_at,
      order_items (
        id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        subtotal,
        product_id,
        seller_id
      ),
      payments (
        method,
        status,
        amount
      )
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    return { success: false, error: 'Order not found' };
  }

  // Fetch product images for each order item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (order.order_items as any[]) || [];
  const itemsWithImages = await Promise.all(
    items.map(async (item: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: images } = await (supabase as any)
        .from('product_images')
        .select('url, is_primary')
        .eq('product_id', item.product_id)
        .limit(5);

      const imageList = images as Array<{ url: string; is_primary: boolean }> | null;
      const primaryImage = imageList?.find((img) => img.is_primary) || imageList?.[0] || null;

      // Fetch seller name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: seller } = await (supabase as any)
        .from('sellers')
        .select('shop_name')
        .eq('id', item.seller_id)
        .single();

      return {
        id: item.id as string,
        product_name: item.product_name as string,
        variant_name: item.variant_name as string | null,
        unit_price: item.unit_price as number,
        quantity: item.quantity as number,
        subtotal: item.subtotal as number,
        product_id: item.product_id as string,
        seller_id: item.seller_id as string,
        image_url: primaryImage?.url || null,
        seller_name: (seller as Record<string, unknown> | null)?.shop_name as string | null,
      };
    })
  );

  // Get payment info
  const payments = order.payments as Array<Record<string, unknown>> | null;
  const payment = payments && payments.length > 0
    ? {
        method: payments[0].method as string,
        status: payments[0].status as string,
        amount: payments[0].amount as number,
      }
    : null;

  const orderDetail: OrderDetailData = {
    id: order.id as string,
    order_number: order.order_number as string,
    status: order.status as OrderStatus,
    subtotal: order.subtotal as number,
    shipping_cost: order.shipping_cost as number,
    tax: order.tax as number,
    total: order.total as number,
    notes: order.notes as string | null,
    delivery_method: order.delivery_method as string,
    delivery_method_name: order.delivery_method_name as string,
    shipping_full_name: order.shipping_full_name as string | null,
    shipping_phone: order.shipping_phone as string | null,
    shipping_address_line_1: order.shipping_address_line_1 as string | null,
    shipping_address_line_2: order.shipping_address_line_2 as string | null,
    shipping_city: order.shipping_city as string | null,
    shipping_region: order.shipping_region as string | null,
    shipping_postal_code: order.shipping_postal_code as string | null,
    shipping_country: order.shipping_country as string | null,
    created_at: order.created_at as string,
    updated_at: order.updated_at as string,
    items: itemsWithImages,
    payment,
  };

  return { success: true, order: orderDetail };
}

// ============================================================
// Cancel Order
// ============================================================

/**
 * Cancel a pending or confirmed order.
 * Uses the cancel_order PostgreSQL function for atomic cancellation
 * and inventory release.
 */
export async function cancelOrder(
  orderId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  // Validate input
  const validation = cancelOrderSchema.safeParse({ orderId });
  if (!validation.success) {
    return { success: false, error: 'Invalid order ID' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Call the atomic database function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('cancel_order', {
    p_user_id: user.id,
    p_order_id: validation.data.orderId,
  });

  if (error) {
    const errorMessage = error.message || 'Failed to cancel order';

    if (errorMessage.includes('not found')) {
      return { success: false, error: 'Order not found' };
    }
    if (errorMessage.includes('no longer be cancelled')) {
      return { success: false, error: 'This order can no longer be cancelled.' };
    }

    return { success: false, error: 'We couldn\'t cancel your order. Please try again.' };
  }

  if (data && typeof data === 'object' && data.success) {
    return { success: true };
  }

  return { success: false, error: 'We couldn\'t cancel your order. Please try again.' };
}
