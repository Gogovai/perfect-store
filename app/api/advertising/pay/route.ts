import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Online payment is not configured.' }, { status: 503 });

    const body = await request.json();
    const advertisementId = String(body.advertisementId || '');
    if (!advertisementId) return NextResponse.json({ error: 'Advertisement ID is required.' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data: seller } = await supabase
      .from('sellers')
      .select('id,status')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (!seller) return NextResponse.json({ error: 'Active seller account required' }, { status: 403 });

    const { data: ad } = await supabase
      .from('advertisements')
      .select('id,seller_id,name,budget,bid_amount,status,starts_at,ends_at')
      .eq('id', advertisementId)
      .eq('seller_id', seller.id)
      .maybeSingle();
    if (!ad) return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    if (ad.status !== 'draft' && ad.status !== 'payment_pending') {
      return NextResponse.json({ error: 'Advertisement is not awaiting payment.' }, { status: 409 });
    }

    // Check for existing active payment
    const { data: existingPayment } = await supabase
      .from('ad_payments')
      .select('id,status')
      .eq('advertisement_id', advertisementId)
      .in('status', ['paid', 'processing'])
      .maybeSingle();
    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already in progress or completed.' }, { status: 409 });
    }

    const amount = Number(ad.bid_amount) || Number(ad.budget) || 0;
    if (amount <= 0) return NextResponse.json({ error: 'Invalid payment amount.' }, { status: 400 });

    const reference = `PS-AD-${advertisementId.slice(0, 8)}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('ad_payments')
      .insert({
        advertisement_id: advertisementId,
        seller_id: seller.id,
        amount,
        currency: 'GHS',
        provider: 'paystack',
        provider_reference: reference,
        status: 'pending',
      })
      .select('id')
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Unable to create payment record.' }, { status: 500 });
    }

    // Update ad status
    await supabase
      .from('advertisements')
      .update({ status: 'payment_pending', updated_at: new Date().toISOString() })
      .eq('id', advertisementId);

    // Initialize Paystack payment
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100),
        currency: 'GHS',
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/advertising/pay/callback`,
        metadata: { advertisement_id: advertisementId, payment_id: payment.id, seller_id: seller.id },
      }),
      cache: 'no-store',
    });

    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      // Clean up payment record on failure
      await supabase.from('ad_payments').delete().eq('id', payment.id);
      await supabase
        .from('advertisements')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', advertisementId);
      return NextResponse.json({ error: result.message || 'Unable to initialize payment' }, { status: 502 });
    }

    // Update payment with initialization data
    await supabase
      .from('ad_payments')
      .update({ status: 'processing', metadata: { paystack_initialization: result.data } })
      .eq('id', payment.id);

    return NextResponse.json({ authorization_url: result.data.authorization_url, reference });
  } catch {
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}
