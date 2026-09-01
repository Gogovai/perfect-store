'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { OrderStatus } from '@/types/database';

const placeOrderSchema = z.object({
  addressId: z.string().uuid('Invalid address'),
  deliveryMethod: z.enum(['standard', 'express']),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

const cancelOrderSchema = z.object({ orderId: z.string().uuid('Invalid order ID') });

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

type ShippingSnapshot = {
  recipient_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export async function placeOrder(
  addressId: string,
  deliveryMethod: string,
  notes?: string
): Promise<PlaceOrderResult> {
  const validation = placeOrderSchema.safeParse({ addressId, deliveryMethod, notes });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please log in to continue checkout.' };

  const { data, error } = await supabase.rpc('create_order', {
    p_address_id: validation.data.addressId,
    p_delivery_method: validation.data.deliveryMethod,
    p_notes: validation.data.notes || null,
  });

  if (error) {
    const message = error.message || '';
    if (message.includes('cart is empty')) return { success: false, error: 'Your cart is empty. Please add items before checkout.' };
    if (message.includes('no longer available')) return { success: false, error: 'One or more items in your cart are no longer available. Please review your cart.' };
    if (message.includes('Insufficient stock')) return { success: false, error: 'There is not enough stock for one or more items. Please update quantities.' };
    if (message.includes('delivery address')) return { success: false, error: 'The selected delivery address is no longer available.' };
    if (message.includes('Invalid delivery method')) return { success: false, error: 'Invalid delivery method selected.' };
    return { success: false, error: 'We couldn\'t create your order. Please try again.' };
  }

  if (data && typeof data === 'object' && data.success) {
    const result = data as { success: boolean; order_id?: string; order_number?: string };
    return { success: true, orderId: result.order_id, orderNumber: result.order_number };
  }

  return { success: false, error: 'We couldn\'t create your order. Please try again.' };
}

export async function getOrderHistory(): Promise<{
  success: boolean;
  orders?: OrderListItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, shipping_fee, total_amount,
      delivery_method, delivery_method_name, created_at, updated_at,
      order_items (id, product_name, product_id)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !orders) return { success: false, error: 'Failed to load order history' };

  const orderListItems: OrderListItem[] = await Promise.all(orders.map(async (order) => {
    const items = order.order_items ?? [];
    let firstItemImage: string | null = null;
    if (items[0]?.product_id) {
      const { data: image } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', items[0].product_id)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      firstItemImage = image?.url ?? null;
    }

    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status as OrderStatus,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_fee,
      tax: 0,
      total: order.total_amount,
      delivery_method: order.delivery_method,
      delivery_method_name: order.delivery_method_name,
      created_at: order.created_at,
      updated_at: order.updated_at,
      item_count: items.length,
      first_item_name: items[0]?.product_name ?? '',
      first_item_image: firstItemImage,
    };
  }));

  return { success: true, orders: orderListItems };
}

export async function getOrderDetail(orderId: string): Promise<{
  success: boolean;
  order?: OrderDetailData;
  error?: string;
}> {
  const validation = z.string().uuid().safeParse(orderId);
  if (!validation.success) return { success: false, error: 'Invalid order ID' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, shipping_fee, total_amount, notes,
      delivery_method, delivery_method_name, shipping_address, created_at, updated_at,
      order_items (id, product_name, sku, unit_price, quantity, total_price, product_id, seller_id, variant_id),
      payments (provider, status, amount)
    `)
    .eq('id', validation.data)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error || !order) return { success: false, error: 'Order not found' };

  const snapshot = (order.shipping_address ?? {}) as ShippingSnapshot;
  const itemsWithDetails = await Promise.all(order.order_items.map(async (item) => {
    const [{ data: image }, { data: seller }, { data: variant }] = await Promise.all([
      supabase.from('product_images').select('url').eq('product_id', item.product_id).order('is_primary', { ascending: false }).order('sort_order', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('sellers').select('store_name').eq('id', item.seller_id).maybeSingle(),
      item.variant_id ? supabase.from('product_variants').select('name').eq('id', item.variant_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      id: item.id,
      product_name: item.product_name,
      variant_name: variant?.name ?? null,
      unit_price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.total_price,
      product_id: item.product_id,
      seller_id: item.seller_id,
      image_url: image?.url ?? null,
      seller_name: seller?.store_name ?? null,
    };
  }));

  const paymentRow = order.payments?.[0];
  const payment = paymentRow ? {
    method: paymentRow.provider,
    status: paymentRow.status,
    amount: paymentRow.amount,
  } : null;

  return {
    success: true,
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status as OrderStatus,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_fee,
      tax: 0,
      total: order.total_amount,
      notes: order.notes,
      delivery_method: order.delivery_method,
      delivery_method_name: order.delivery_method_name,
      shipping_full_name: snapshot.recipient_name ?? null,
      shipping_phone: snapshot.phone ?? null,
      shipping_address_line_1: snapshot.address_line1 ?? null,
      shipping_address_line_2: snapshot.address_line2 ?? null,
      shipping_city: snapshot.city ?? null,
      shipping_region: snapshot.region ?? null,
      shipping_postal_code: snapshot.postal_code ?? null,
      shipping_country: snapshot.country ?? null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: itemsWithDetails,
      payment,
    },
  };
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const validation = cancelOrderSchema.safeParse({ orderId });
  if (!validation.success) return { success: false, error: 'Invalid order ID' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('cancel_order', { p_order_id: validation.data.orderId });
  if (error) {
    if (error.message.includes('not found')) return { success: false, error: 'Order not found' };
    if (error.message.includes('no longer be cancelled')) return { success: false, error: 'This order can no longer be cancelled.' };
    return { success: false, error: 'We couldn\'t cancel your order. Please try again.' };
  }

  if (data && typeof data === 'object' && data.success) return { success: true };
  return { success: false, error: 'We couldn\'t cancel your order. Please try again.' };
}
