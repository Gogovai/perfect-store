'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  orderId: z.string().uuid(),
  method: z.literal('hubtel'),
});

export async function setPaymentMethod(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  if (parsed.data.method === 'hubtel' && !(process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET && process.env.HUBTEL_MERCHANT_ACCOUNT_ID)) {
    return { success: false, error: 'Mobile Money and card payments are not configured yet. Please try again later.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,total_amount,currency,status')
    .eq('id', parsed.data.orderId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (orderError) return { success: false, error: 'Unable to load this order.' };
  if (!order) return { success: false, error: 'Order not found' };
  if (order.status !== 'pending') {
    return { success: false, error: 'Payment method can only be changed while the order is pending.' };
  }

  const { data: existingPayment, error: existingError } = await supabase
    .from('payments')
    .select('id,provider,status')
    .eq('order_id', order.id)
    .maybeSingle();

  if (existingError) return { success: false, error: 'Unable to load payment details.' };
  if (existingPayment?.status === 'paid') {
    return { success: false, error: 'This order has already been paid.' };
  }
  if (
    existingPayment?.status === 'processing' &&
    existingPayment.provider !== parsed.data.method
  ) {
    return { success: false, error: 'A payment attempt is already processing. Complete or resolve it before changing methods.' };
  }

  // Do not reset a live in-flight payment to pending. Repeated requests for the
  // same method are harmless; the existing reference remains intact.
  if (existingPayment?.status === 'processing') {
    revalidatePath(`/account/orders/${order.id}`);
    return { success: true, amount: Number(order.total_amount) };
  }

  const { error } = await supabase
    .from('payments')
    .upsert({
      order_id: order.id,
      provider: parsed.data.method,
      status: 'pending',
      amount: order.total_amount,
      currency: order.currency,
      metadata: {},
    }, { onConflict: 'order_id' });

  if (error) return { success: false, error: 'Unable to save payment method' };
  revalidatePath(`/account/orders/${order.id}`);
  return { success: true, amount: Number(order.total_amount) };
}
