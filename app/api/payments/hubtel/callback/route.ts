import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type UnknownRecord = Record<string, unknown>;

function firstRecord(value: unknown): UnknownRecord | null {
  return Array.isArray(value)
    ? value[0] && typeof value[0] === 'object' ? value[0] as UnknownRecord : null
    : value && typeof value === 'object' ? value as UnknownRecord : null;
}

function field(record: UnknownRecord | null, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function textField(record: UnknownRecord | null, ...keys: string[]): string {
  const value = field(record, ...keys);
  return value === undefined ? '' : String(value);
}

function parseAmount(record: UnknownRecord | null): number {
  return Number(field(record, 'amount', 'Amount', 'totalAmount', 'TotalAmount', 'transactionAmount', 'TransactionAmount'));
}

async function confirmPendingOrder(supabase: ReturnType<typeof getSupabaseAdmin>, orderId: string) {
  return supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId)
    .eq('status', 'pending');
}

export async function POST(request: Request) {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 503 });
  }

  let event: UnknownRecord;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid callback payload.' }, { status: 400 });
    }
    event = payload as UnknownRecord;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // Hubtel integrations have sent both flat callback objects and objects with
  // transaction fields nested under Data/data. Prefer the nested value, but
  // fall back field-by-field to the root so a partial Data object cannot hide
  // ClientReference or TransactionId from the actual callback.
  const eventData = firstRecord(field(event, 'data', 'Data')) ?? event;
  const reference =
    textField(eventData, 'clientReference', 'ClientReference', 'invoiceId', 'InvoiceId') ||
    textField(event, 'clientReference', 'ClientReference', 'invoiceId', 'InvoiceId');
  const transactionId =
    textField(eventData, 'transactionId', 'TransactionId') ||
    textField(event, 'transactionId', 'TransactionId');

  if (!reference) {
    return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id,order_id,amount,currency,status,provider,provider_reference')
      .eq('provider', 'hubtel')
      .eq('provider_reference', reference)
      .maybeSingle();

    if (paymentError) return NextResponse.json({ error: 'Unable to find payment.' }, { status: 500 });
    // A callback for an unknown/expired reference must never create or confirm an order.
    if (!payment) return NextResponse.json({ received: true });

    if (payment.currency !== 'GHS' || !Number.isFinite(Number(payment.amount)) || Number(payment.amount) <= 0) {
      return NextResponse.json({ error: 'Stored payment amount or currency is invalid.' }, { status: 409 });
    }

    // Repair a partial success safely: only a payment previously verified by this
    // handler can reach "paid", and only a pending order may be confirmed.
    if (payment.status === 'paid') {
      const { error } = await confirmPendingOrder(supabase, payment.order_id);
      if (error) return NextResponse.json({ error: 'Unable to reconcile the paid order.' }, { status: 500 });
      return NextResponse.json({ received: true });
    }

    // Do not resurrect failed, cancelled, or refunded payment records.
    if (!['pending', 'processing'].includes(payment.status)) {
      return NextResponse.json({ received: true });
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const verificationUrl = transactionId
      ? `https://payproxyapi.hubtel.com/transaction/${encodeURIComponent(transactionId)}`
      : 'https://payproxyapi.hubtel.com/transaction/status';

    // Some Hubtel checkout callbacks contain only a client reference. Use the
    // documented status endpoint in that case rather than rejecting a valid event.
    const verificationResponse = await fetch(verificationUrl, {
      method: transactionId ? 'GET' : 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...(transactionId ? {} : { body: JSON.stringify({ ClientReference: reference }) }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const verification: unknown = await verificationResponse.json().catch(() => null);
    const verificationRecord = firstRecord(verification);
    const verificationData = firstRecord(field(verificationRecord, 'data', 'Data'));
    const responseCode =
      textField(verificationRecord, 'responseCode', 'ResponseCode', 'code', 'Code') ||
      textField(verificationData, 'responseCode', 'ResponseCode', 'code', 'Code');
    const verifiedStatus = (
      textField(verificationData, 'status', 'Status') ||
      textField(verificationRecord, 'status', 'Status')
    ).trim().toLowerCase();
    const verifiedReference =
      textField(verificationData, 'clientReference', 'ClientReference', 'invoiceId', 'InvoiceId') ||
      textField(verificationRecord, 'clientReference', 'ClientReference', 'invoiceId', 'InvoiceId');
    const verifiedTransactionId =
      textField(verificationData, 'transactionId', 'TransactionId') ||
      textField(verificationRecord, 'transactionId', 'TransactionId');
    const nestedAmount = parseAmount(verificationData);
    const verifiedAmount = Number.isFinite(nestedAmount) && nestedAmount > 0
      ? nestedAmount
      : parseAmount(verificationRecord);
    const verifiedCurrency =
      textField(verificationData, 'currency', 'Currency') ||
      textField(verificationRecord, 'currency', 'Currency');

    if (
      !verificationResponse.ok ||
      !['00', '0000', '200'].includes(responseCode) ||
      !['paid', 'completed', 'success', 'successful'].includes(verifiedStatus) ||
      verifiedReference !== reference ||
      (transactionId && verifiedTransactionId && verifiedTransactionId !== transactionId) ||
      !Number.isFinite(verifiedAmount) ||
      Math.abs(verifiedAmount - Number(payment.amount)) > 0.009 ||
      (verifiedCurrency && verifiedCurrency.toUpperCase() !== 'GHS')
    ) {
      // Non-2xx asks Hubtel to retry transient verification failures.
      return NextResponse.json({ error: 'Payment has not been verified.' }, { status: 503 });
    }

    const { data: updatedPayment, error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: {
          hubtel_transaction_id: verifiedTransactionId || transactionId || null,
          hubtel_verification: verificationData,
        },
      })
      .eq('id', payment.id)
      .in('status', ['pending', 'processing'])
      .select('id')
      .maybeSingle();

    if (updatePaymentError) return NextResponse.json({ error: 'Unable to update payment.' }, { status: 500 });

    if (!updatedPayment) {
      const { data: latestPayment, error: latestPaymentError } = await supabase
        .from('payments')
        .select('status')
        .eq('id', payment.id)
        .maybeSingle();
      if (latestPaymentError) return NextResponse.json({ error: 'Unable to reconcile payment state.' }, { status: 500 });
      if (latestPayment?.status !== 'paid') return NextResponse.json({ received: true });
    }

    const { error: updateOrderError } = await confirmPendingOrder(supabase, payment.order_id);
    if (updateOrderError) return NextResponse.json({ error: 'Payment verified but order update failed.' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Payment verified and recorded.' });
  } catch {
    return NextResponse.json({ error: 'Callback processing failed.' }, { status: 500 });
  }
}
