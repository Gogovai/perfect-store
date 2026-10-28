import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference') || '';
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', siteUrl));
  if (!reference || !secretKey) return NextResponse.redirect(new URL('/account/orders?payment=verification_failed', siteUrl));

  const { data: payment } = await supabase.from('payments')
    .select('order_id,amount,currency,provider,status,provider_reference')
    .eq('provider','paystack').eq('provider_reference',reference).maybeSingle();
  if (!payment) return NextResponse.redirect(new URL('/account/orders?payment=verification_failed', siteUrl));
  const { data: order } = await supabase.from('orders').select('id,customer_id').eq('id',payment.order_id).maybeSingle();
  if (!order || order.customer_id !== user.id) return NextResponse.redirect(new URL('/account/orders', siteUrl));

  try {
    const response = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    const result = await response.json().catch(() => null) as {status?:boolean;data?:{id?:number;status?:string;reference?:string;amount?:number;currency?:string}} | null;
    if (response.ok && result?.status && result.data?.status === 'success' &&
        result.data.reference === reference && result.data.currency === 'GHS' &&
        Math.abs(Number(result.data.amount)/100-Number(payment.amount)) <= 0.009) {
      const admin = getSupabaseAdmin();
      const { data: updatedPayment, error: paymentUpdateError } = await admin.from('payments').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: { paystack_transaction_id: result.data.id ?? null },
      }).eq('provider', 'paystack').eq('provider_reference', reference)
        .in('status', ['pending', 'processing']).select('id').maybeSingle();
      if (paymentUpdateError) return NextResponse.redirect(new URL(`/account/orders/${order.id}?payment=verification_pending`, siteUrl));
      if (updatedPayment || payment.status === 'paid') {
        const { error: orderUpdateError } = await admin.from('orders').update({ status: 'confirmed' })
          .eq('id', order.id).eq('status', 'pending');
        if (orderUpdateError) return NextResponse.redirect(new URL(`/account/orders/${order.id}?payment=verification_pending`, siteUrl));
      }
      return NextResponse.redirect(new URL(`/account/orders/${order.id}?payment=confirmed`, siteUrl));
    }
  } catch { /* Show pending state; Paystack will retry the webhook. */ }
  return NextResponse.redirect(new URL(`/account/orders/${order.id}?payment=verification_pending`, siteUrl));
}
