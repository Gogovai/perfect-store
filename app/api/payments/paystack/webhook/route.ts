import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue | null => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null;

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  const expected = createHmac('sha512', secretKey).update(rawBody).digest('hex');
  const suppliedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let event: RecordValue | null;
  try { event = record(JSON.parse(rawBody)); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  if (event?.event !== 'charge.success') return NextResponse.json({ received: true });

  const data = record(event.data);
  const reference = typeof data?.reference === 'string' ? data.reference : '';
  const status = typeof data?.status === 'string' ? data.status : '';
  if (!reference || status !== 'success') return NextResponse.json({ received: true });

  try {
    const supabase = getSupabaseAdmin();
    const { data: payment, error } = await supabase.from('payments')
      .select('id,order_id,amount,currency,status,provider,provider_reference')
      .eq('provider', 'paystack').eq('provider_reference', reference).maybeSingle();
    if (error) return NextResponse.json({ error: 'Unable to load payment.' }, { status: 500 });
    if (!payment) return NextResponse.json({ received: true });
    if (payment.currency !== 'GHS' || !Number.isFinite(Number(payment.amount)) || Number(payment.amount) <= 0) {
      return NextResponse.json({ error: 'Stored payment details are invalid.' }, { status: 409 });
    }
    if (payment.status === 'paid') {
      const { error: orderError } = await supabase.from('orders').update({status:'confirmed'})
        .eq('id', payment.order_id).eq('status','pending');
      if (orderError) return NextResponse.json({ error: 'Unable to reconcile paid order.' }, { status: 500 });
      return NextResponse.json({ received: true });
    }
    if (!['pending','processing'].includes(payment.status)) return NextResponse.json({ received: true });

    // Never trust webhook payload alone: fetch the transaction directly from Paystack.
    const verifyResponse = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    const verification = await verifyResponse.json().catch(() => null) as {status?: boolean; data?: RecordValue} | null;
    const verified = record(verification?.data);
    const amount = Number(verified?.amount);
    if (!verifyResponse.ok || !verification?.status || verified?.status !== 'success' ||
        verified?.reference !== reference || !Number.isFinite(amount) ||
        Math.abs(amount / 100 - Number(payment.amount)) > 0.009 ||
        verified?.currency !== 'GHS' || Number(verified?.id) !== Number(data?.id)) {
      return NextResponse.json({ error: 'Transaction verification failed.' }, { status: 503 });
    }

    const { data: updated, error: updateError } = await supabase.from('payments').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: { paystack_transaction_id: verified.id, paystack_channel: verified.channel, paystack_gateway_response: verified.gateway_response },
    }).eq('id', payment.id).in('status',['pending','processing']).select('id').maybeSingle();
    if (updateError) return NextResponse.json({ error: 'Unable to update payment.' }, { status: 500 });
    if (!updated) {
      const { data: latest, error: latestError } = await supabase.from('payments').select('status').eq('id',payment.id).maybeSingle();
      if (latestError) return NextResponse.json({ error: 'Unable to reconcile payment.' }, { status: 500 });
      if (latest?.status !== 'paid') return NextResponse.json({ received: true });
    }
    const { error: orderError } = await supabase.from('orders').update({status:'confirmed'})
      .eq('id',payment.order_id).eq('status','pending');
    if (orderError) return NextResponse.json({ error: 'Payment verified but order update failed.' }, { status: 500 });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
