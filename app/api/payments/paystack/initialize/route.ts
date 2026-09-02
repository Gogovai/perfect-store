import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Online payment is not configured.' }, { status: 503 });

    const body = await request.json();
    const orderId = String(body.orderId || '');
    if (!orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data: order } = await supabase
      .from('orders')
      .select('id,order_number,total_amount,currency,status')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'pending') return NextResponse.json({ error: 'This order is not awaiting payment.' }, { status: 409 });

    const { data: payment } = await supabase
      .from('payments')
      .select('id,status,provider,amount,currency')
      .eq('order_id', order.id)
      .maybeSingle();

    if (!payment) return NextResponse.json({ error: 'Payment record not found.' }, { status: 409 });
    if (Number(payment.amount) !== Number(order.total_amount) || payment.currency !== order.currency) {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 409 });
    }

    const reference = `PS-${order.order_number}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(Number(order.total_amount) * 100),
        currency: order.currency,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/payments/paystack/callback`,
        metadata: { order_id: order.id, payment_id: payment.id },
      }),
      cache: 'no-store',
    });

    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      return NextResponse.json({ error: result.message || 'Unable to initialize payment' }, { status: 502 });
    }

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ provider: 'paystack', provider_reference: reference, status: 'processing', metadata: { paystack_initialization: result.data } })
      .eq('id', payment.id)
      .eq('order_id', order.id);

    if (paymentUpdateError) return NextResponse.json({ error: 'Unable to record payment initialization.' }, { status: 500 });

    return NextResponse.json({ authorization_url: result.data.authorization_url, reference });
  } catch {
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}
