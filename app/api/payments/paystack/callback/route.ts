import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  if (!reference) return NextResponse.redirect(new URL('/account/orders?payment=missing', url));

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.redirect(new URL('/account/orders?payment=unavailable', url));

  try {
    const supabase = getSupabaseAdmin();
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' }
    );
    const result = await verify.json();

    if (!verify.ok || !result.status || result.data?.status !== 'success') {
      return NextResponse.redirect(new URL('/account/orders?payment=failed', url));
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('id,order_id,amount,currency,status,provider,provider_reference')
      .eq('provider', 'paystack')
      .eq('provider_reference', reference)
      .maybeSingle();

    if (!payment) return NextResponse.redirect(new URL('/account/orders?payment=not-found', url));

    if (result.data.currency !== payment.currency || Number(result.data.amount) !== Math.round(Number(payment.amount) * 100)) {
      return NextResponse.redirect(new URL(`/account/orders/${payment.order_id}?payment=amount-mismatch`, url));
    }

    if (payment.status !== 'paid') {
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: { paystack_verification: result.data },
        })
        .eq('id', payment.id)
        .neq('status', 'paid');

      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', payment.order_id)
        .eq('status', 'pending');
    }

    return NextResponse.redirect(new URL(`/account/orders/${payment.order_id}/success?payment=success`, url));
  } catch {
    return NextResponse.redirect(new URL('/account/orders?payment=failed', url));
  }
}
