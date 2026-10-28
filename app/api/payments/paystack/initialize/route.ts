import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PaystackInitResponse = {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string; reference?: string };
};

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    if (!secretKey) return NextResponse.json({ error: 'Paystack payments are not configured.' }, { status: 503 });

    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    if (!orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { data: order, error: orderError } = await supabase.from('orders')
      .select('id,order_number,total_amount,currency,status,shipping_address')
      .eq('id', orderId).eq('customer_id', user.id).maybeSingle();
    if (orderError) return NextResponse.json({ error: 'Unable to load this order.' }, { status: 500 });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status !== 'pending') return NextResponse.json({ error: 'This order is not awaiting payment.' }, { status: 409 });
    if (order.currency !== 'GHS' || !Number.isFinite(Number(order.total_amount)) || Number(order.total_amount) <= 0) {
      return NextResponse.json({ error: 'Invalid order amount or currency.' }, { status: 409 });
    }
    if (!user.email) return NextResponse.json({ error: 'Add a valid email address to your account before paying.' }, { status: 400 });

    const { data: payment, error: paymentError } = await supabase.from('payments')
      .select('id,status,provider,amount,currency,provider_reference,updated_at')
      .eq('order_id', order.id).maybeSingle();
    if (paymentError) return NextResponse.json({ error: 'Unable to load payment details.' }, { status: 500 });
    if (!payment || payment.provider !== 'paystack') return NextResponse.json({ error: 'This order is not configured for Paystack.' }, { status: 409 });
    if (payment.status === 'paid') return NextResponse.json({ already_paid: true });
    if (!['pending','processing'].includes(payment.status)) return NextResponse.json({ error: 'This payment cannot be retried. Contact support.' }, { status: 409 });
    if (Math.abs(Number(payment.amount) - Number(order.total_amount)) > 0.009 || payment.currency !== 'GHS') {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 409 });
    }

    if (payment.status === 'processing' && payment.provider_reference) {
      const updatedAt = Date.parse(String(payment.updated_at ?? ''));
      if (Number.isFinite(updatedAt) && Date.now() - updatedAt < 10 * 60 * 1000) {
        return NextResponse.json({ error: 'A Paystack payment attempt is already processing. Wait for confirmation before retrying.' }, { status: 409 });
      }
      const verify = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(payment.provider_reference), {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000),
      });
      const previous = await verify.json().catch(() => null) as { status?: boolean; data?: { status?: string; reference?: string; amount?: number; currency?: string } } | null;
      if (!verify.ok || !previous?.status || previous.data?.reference !== payment.provider_reference ||
          !Number.isFinite(Number(previous.data?.amount)) ||
          Math.abs(Number(previous.data?.amount) / 100 - Number(payment.amount)) > 0.009 ||
          previous.data?.currency !== 'GHS') {
        return NextResponse.json({ error: 'Unable to safely verify the previous payment attempt.' }, { status: 503 });
      }
      if (previous.data?.status === 'success') return NextResponse.json({ error: 'The previous payment may have completed. Refresh the order before retrying.' }, { status: 409 });
      if (!['abandoned','failed','pending','ongoing'].includes(String(previous.data?.status))) {
        return NextResponse.json({ error: 'The previous payment status is unclear. Contact support before retrying.' }, { status: 409 });
      }
    }

    const reference = `PS-${order.order_number}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const { data: reservation, error: reserveError } = await supabase.rpc('reserve_paystack_payment_attempt', {
      p_order_id: order.id,
      p_reference: reference,
      p_expected_status: payment.status,
      p_expected_reference: payment.provider_reference,
    });
    if (reserveError || !reservation || typeof reservation !== 'object' || (reservation as {success?: unknown}).success !== true) {
      return NextResponse.json({ error: 'Payment state changed. Refresh the order before retrying.' }, { status: 409 });
    }

    const shipping = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address as Record<string, unknown> : {};
    const fullName = String(shipping.recipient_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').trim();
    const initResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: String(Math.round(Number(order.total_amount) * 100)),
        currency: 'GHS',
        reference,
        callback_url: `${siteUrl}/api/payments/paystack/callback`,
        channels: ['card', 'mobile_money'],
        metadata: { order_id: order.id, order_number: order.order_number, customer_name: fullName, custom_fields: [] },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const result = await initResponse.json().catch(() => null) as PaystackInitResponse | null;
    if (!initResponse.ok || !result?.status || !result.data?.authorization_url ||
        !result.data.authorization_url.startsWith('https://checkout.paystack.com/')) {
      // Only reset when Paystack explicitly rejected initialization. Network
      // failures and ambiguous responses must retain the reference for verification.
      if (result?.status === false) {
        await supabase.rpc('reset_paystack_payment_attempt', {
          p_order_id: order.id,
          p_reference: reference,
        });
      }
      return NextResponse.json({ error: result?.message || 'Unable to initialize Paystack checkout.' }, { status: 502 });
    }
    return NextResponse.json({ checkout_url: result.data.authorization_url, reference });
  } catch {
    return NextResponse.json({ error: 'Paystack payment initialization failed.' }, { status: 500 });
  }
}
