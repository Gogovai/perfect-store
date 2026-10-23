import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type HubtelCheckoutResponse = {
  responseCode?: string;
  status?: string;
  message?: string;
  data?: {
    checkoutUrl?: string;
    checkoutId?: string;
    clientReference?: string;
  };
  ResponseCode?: string;
  ResponseMessage?: string;
  Data?: {
    CheckoutUrl?: string;
    CheckoutId?: string;
    InvoiceId?: string;
  };
};

export async function POST(request: Request) {
  try {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    const merchantAccountId = process.env.HUBTEL_MERCHANT_ACCOUNT_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    if (!clientId || !clientSecret || !merchantAccountId) {
      return NextResponse.json({ error: 'Hubtel online payments are not configured.' }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    if (!orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,order_number,total_amount,currency,status')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (orderError) return NextResponse.json({ error: 'Unable to load this order.' }, { status: 500 });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status !== 'pending') return NextResponse.json({ error: 'This order is not awaiting payment.' }, { status: 409 });
    if (order.currency !== 'GHS' || Number(order.total_amount) <= 0) {
      return NextResponse.json({ error: 'This order has an invalid payment amount or currency.' }, { status: 409 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id,status,provider,amount,currency,provider_reference,updated_at')
      .eq('order_id', order.id)
      .maybeSingle();

    if (paymentError) return NextResponse.json({ error: 'Unable to load payment details.' }, { status: 500 });
    if (!payment) return NextResponse.json({ error: 'Payment record not found.' }, { status: 409 });
    if (payment.status === 'paid') return NextResponse.json({ error: 'This order is already paid.' }, { status: 409 });
    if (payment.provider !== 'hubtel') {
      return NextResponse.json({ error: 'This order is not configured for Hubtel payment.' }, { status: 409 });
    }
    if (Number(payment.amount) !== Number(order.total_amount) || payment.currency !== order.currency) {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 409 });
    }

    // Never create a second live checkout while a recent Hubtel attempt may
    // still be authorized by the customer. Older attempts are checked with
    // Hubtel before we allow another checkout URL to be issued.
    if (payment.status === 'processing' && payment.provider_reference) {
      const updatedAt = Date.parse(String(payment.updated_at ?? ''));
      const isRecentAttempt = Number.isFinite(updatedAt) && Date.now() - updatedAt < 10 * 60 * 1000;
      if (isRecentAttempt) {
        return NextResponse.json({
          error: 'A Hubtel payment attempt is already processing. Wait for confirmation before retrying.',
        }, { status: 409 });
      }

      const credentialsForStatus = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      let statusResponse: Response;
      try {
        statusResponse = await fetch('https://payproxyapi.hubtel.com/transaction/status', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentialsForStatus}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ClientReference: payment.provider_reference }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        return NextResponse.json({ error: 'Unable to verify the previous payment attempt. Please try again shortly.' }, { status: 503 });
      }
      const previousResult = await statusResponse.json().catch(() => null) as Record<string, unknown> | null;
      const previousData = (previousResult?.Data ?? previousResult?.data) as Record<string, unknown> | undefined;
      const previousCode = String(previousResult?.ResponseCode ?? previousResult?.responseCode ?? '');
      const previousStatus = String(previousData?.Status ?? previousData?.status ?? '').toLowerCase();
      const previousReference = String(previousData?.ClientReference ?? previousData?.clientReference ?? '');
      const previousAmount = Number(previousData?.Amount ?? previousData?.amount);

      if (!statusResponse.ok || !['00', '0000', '200'].includes(previousCode)) {
        return NextResponse.json({ error: 'Unable to verify the previous payment attempt. Please try again shortly.' }, { status: 503 });
      }
      if (
        previousReference !== payment.provider_reference ||
        !Number.isFinite(previousAmount) ||
        Math.abs(previousAmount - Number(payment.amount)) > 0.009
      ) {
        return NextResponse.json({ error: 'Previous payment details could not be matched safely. Contact store support.' }, { status: 409 });
      }
      if (['paid', 'completed', 'success', 'successful'].includes(previousStatus)) {
        return NextResponse.json({ error: 'The previous payment may have completed. Refresh your order status before trying again.' }, { status: 409 });
      }
      if (!['pending', 'unpaid', 'failed', 'expired', 'cancelled', 'refunded'].includes(previousStatus)) {
        return NextResponse.json({ error: 'The previous payment status is unclear. Please contact store support before retrying.' }, { status: 409 });
      }
    }

    const reference = `PS-${order.order_number}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;

    // Persist the reference before contacting Hubtel. This closes the callback
    // race where Hubtel can notify us before the checkout-init response returns.
    // Compare-and-swap also prevents concurrent requests from opening two checkouts.
    let reserveQuery = supabase
      .from('payments')
      .update({
        provider: 'hubtel',
        provider_reference: reference,
        status: 'processing',
        metadata: { hubtel_initialization_started_at: new Date().toISOString() },
      })
      .eq('id', payment.id)
      .eq('order_id', order.id)
      .eq('status', payment.status);
    reserveQuery = payment.provider_reference
      ? reserveQuery.eq('provider_reference', payment.provider_reference)
      : reserveQuery.is('provider_reference', null);
    const { data: reservedPayment, error: reserveError } = await reserveQuery.select('id').maybeSingle();
    if (reserveError) return NextResponse.json({ error: 'Unable to reserve payment initialization.' }, { status: 500 });
    if (!reservedPayment) {
      return NextResponse.json({ error: 'Payment state changed. Refresh the order before retrying.' }, { status: 409 });
    }

    const callbackUrl = `${siteUrl}/api/payments/hubtel/callback`;
    const returnUrl = `${siteUrl}/account/orders/${order.id}?payment=processing`;
    const cancellationUrl = `${siteUrl}/account/orders/${order.id}?payment=cancelled`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const hubtelResponse = await fetch('https://payproxyapi.hubtel.com/items/initiate', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalAmount: Number(order.total_amount),
        description: `Clothing order ${order.order_number}`,
        callbackUrl,
        returnUrl,
        cancellationUrl,
        merchantAccountNumber: merchantAccountId,
        clientReference: reference,
      }),
      cache: 'no-store',
    });

    const result = await hubtelResponse.json().catch(() => ({})) as HubtelCheckoutResponse;
    const responseCode = result.responseCode ?? result.ResponseCode;
    const checkoutUrl = result.data?.checkoutUrl ?? result.Data?.CheckoutUrl;

    if (responseCode && !['0000', '00'].includes(String(responseCode))) {
      // An explicit Hubtel rejection means no checkout was created. Reset only
      // this attempt; never overwrite a callback that already marked it paid.
      const { error: resetError } = await supabase
        .from('payments')
        .update({ status: 'pending', provider_reference: null, metadata: {} })
        .eq('id', payment.id)
        .eq('order_id', order.id)
        .eq('provider_reference', reference)
        .eq('status', 'processing');
      if (resetError) return NextResponse.json({ error: 'Unable to reset the rejected payment attempt.' }, { status: 500 });

      const { data: latestPayment, error: latestPaymentError } = await supabase
        .from('payments')
        .select('status')
        .eq('id', payment.id)
        .maybeSingle();
      if (latestPaymentError) return NextResponse.json({ error: 'Unable to reconcile payment state.' }, { status: 500 });
      if (latestPayment?.status === 'paid') {
        return NextResponse.json({ already_paid: true, reference });
      }
      return NextResponse.json({ error: 'Hubtel rejected the checkout request. Please try again.' }, { status: 502 });
    }

    let secureCheckoutUrl = false;
    try {
      secureCheckoutUrl = typeof checkoutUrl === 'string' && new URL(checkoutUrl).protocol === 'https:';
    } catch {
      secureCheckoutUrl = false;
    }

    if (!hubtelResponse.ok || typeof checkoutUrl !== 'string' || !secureCheckoutUrl || !['0000', '00'].includes(String(responseCode))) {
      // Keep the reference in processing state for ambiguous responses. The
      // retry flow checks Hubtel status before it can create another attempt.
      const { data: latestPayment, error: latestPaymentError } = await supabase
        .from('payments')
        .select('status')
        .eq('id', payment.id)
        .maybeSingle();
      if (latestPaymentError) return NextResponse.json({ error: 'Unable to reconcile payment state.' }, { status: 500 });
      if (latestPayment?.status === 'paid') {
        return NextResponse.json({ already_paid: true, reference });
      }
      return NextResponse.json({ error: 'Hubtel checkout status is unclear. Please wait briefly and refresh your order.' }, { status: 502 });
    }

    // Do not rewrite payment state here: the callback may already have marked
    // the payment paid while the initiate request was returning.
    const { data: latestPayment, error: latestPaymentError } = await supabase
      .from('payments')
      .select('status')
      .eq('id', payment.id)
      .maybeSingle();
    if (latestPaymentError) return NextResponse.json({ error: 'Unable to reconcile payment state.' }, { status: 500 });
    if (latestPayment?.status === 'paid') {
      return NextResponse.json({ already_paid: true, reference });
    }

    return NextResponse.json({ checkout_url: checkoutUrl, reference });
  } catch {
    return NextResponse.json({ error: 'Payment initialization failed.' }, { status: 500 });
  }
}
