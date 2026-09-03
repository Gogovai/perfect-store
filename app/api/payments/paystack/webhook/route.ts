import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 });

  const signature = request.headers.get('x-paystack-signature');
  const rawBody = await request.text();
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });

  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const provided = Buffer.from(signature, 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  if (provided.length !== calculated.length || !crypto.timingSafeEqual(provided, calculated)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event?: string; data?: { status?: string; reference?: string; amount?: number; currency?: string; [key: string]: unknown } };
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (event.event !== 'charge.success' || event.data?.status !== 'success' || !event.data.reference) {
    return NextResponse.json({ received: true });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: payment } = await supabase
      .from('payments')
      .select('id,order_id,amount,currency,status,provider,provider_reference')
      .eq('provider', 'paystack')
      .eq('provider_reference', event.data.reference)
      .maybeSingle();

    if (!payment) return NextResponse.json({ received: true });
    if (payment.status === 'paid') return NextResponse.json({ received: true });
    if (event.data.currency !== payment.currency || Number(event.data.amount) !== Math.round(Number(payment.amount) * 100)) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    await supabase.from('payments').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: { paystack_webhook: event.data },
    }).eq('id', payment.id).eq('status', 'pending');

    await supabase.from('orders').update({ status: 'confirmed' })
      .eq('id', payment.order_id).eq('status', 'pending');

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
