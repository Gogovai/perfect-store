import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type UnknownRecord = Record<string, unknown>;

function firstRecord(value: unknown): UnknownRecord | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === 'object' ? value[0] as UnknownRecord : null;
  return value && typeof value === 'object' ? value as UnknownRecord : null;
}

function field(record: UnknownRecord | null, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
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

  const eventData = firstRecord(field(event, 'data', 'Data')) ?? event;
  const reference = String(field(eventData, 'clientReference', 'ClientReference', 'invoiceId', 'InvoiceId') ?? '');
  const transactionId = String(field(eventData, 'transactionId', 'TransactionId') ?? '');

  if (!reference || !transactionId) {
    return NextResponse.json({ error: 'Missing payment reference or transaction ID.' }, { status: 400 });
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
    if (!payment) return NextResponse.json({ received: true });
    if (payment.status === 'paid') return NextResponse.json({ received: true });

    // Do not trust the callback body alone. Ask Hubtel for the transaction status
    // before marking an order as paid.
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const verificationResponse = await fetch(
      `https://payproxyapi.hubtel.com/transaction/${encodeURIComponent(transactionId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    const verification: unknown = await verificationResponse.json().catch(() => null);
    const verificationRecord = firstRecord(verification);
    const verificationData = firstRecord(field(verificationRecord, 'data', 'Data'));
    const responseCode = String(field(verificationRecord, 'responseCode', 'ResponseCode') ?? '');
    const verifiedStatus = String(field(verificationData, 'status', 'Status') ?? '').toLowerCase();
    const verifiedReference = String(field(verificationData, 'clientReference', 'ClientReference', 'invoiceId', 'InvoiceId') ?? '');
    const verifiedTransactionId = String(field(verificationData, 'transactionId', 'TransactionId') ?? '');
    const verifiedAmount = Number(field(verificationData, 'amount', 'Amount', 'transactionAmount', 'TransactionAmount'));

    if (
      !verificationResponse.ok ||
      !['00', '0000'].includes(responseCode) ||
      !['paid', 'completed', 'success'].includes(verifiedStatus) ||
      verifiedReference !== reference ||
      verifiedTransactionId !== transactionId ||
      !Number.isFinite(verifiedAmount) ||
      Math.abs(verifiedAmount - Number(payment.amount)) > 0.009
    ) {
      // Ask Hubtel to retry transient verification failures.
      return NextResponse.json({ error: 'Payment has not been verified.' }, { status: 503 });
    }

    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: { hubtel_transaction_id: transactionId, hubtel_verification: verificationData },
      })
      .eq('id', payment.id)
      .in('status', ['pending', 'processing']);

    if (updatePaymentError) return NextResponse.json({ error: 'Unable to update payment.' }, { status: 500 });

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', payment.order_id)
      .eq('status', 'pending');

    if (updateOrderError) return NextResponse.json({ error: 'Payment verified but order update failed.' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Payment verified and recorded.' });
  } catch {
    return NextResponse.json({ error: 'Callback processing failed.' }, { status: 500 });
  }
}
