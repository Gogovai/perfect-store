import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  if (!reference) return NextResponse.redirect(new URL('/seller/advertising?payment=missing', url));

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.redirect(new URL('/seller/advertising?payment=unavailable', url));

  try {
    const supabase = getSupabaseAdmin();
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' }
    );
    const result = await verify.json();

    if (!verify.ok || !result.status || result.data?.status !== 'success') {
      return NextResponse.redirect(new URL('/seller/advertising?payment=failed', url));
    }

    const { data: payment } = await supabase
      .from('ad_payments')
      .select('id,advertisement_id,seller_id,amount,currency,status')
      .eq('provider_reference', reference)
      .maybeSingle();

    if (!payment) return NextResponse.redirect(new URL('/seller/advertising?payment=not-found', url));

    // Verify amount
    if (result.data.currency !== payment.currency || Number(result.data.amount) !== Math.round(Number(payment.amount) * 100)) {
      return NextResponse.redirect(new URL('/seller/advertising?payment=amount-mismatch', url));
    }

    if (payment.status !== 'paid') {
      // Mark payment as paid
      await supabase
        .from('ad_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: { paystack_verification: result.data },
        })
        .eq('id', payment.id)
        .neq('status', 'paid');

      // Update advertisement status to pending_review (awaiting admin approval)
      await supabase
        .from('advertisements')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', payment.advertisement_id)
        .in('status', ['draft', 'payment_pending']);
    }

    return NextResponse.redirect(new URL('/seller/advertising?payment=success', url));
  } catch {
    return NextResponse.redirect(new URL('/seller/advertising?payment=failed', url));
  }
}
