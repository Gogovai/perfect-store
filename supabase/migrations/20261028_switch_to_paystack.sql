-- Add Paystack without deleting legacy Hubtel payment records.
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'paystack';

-- Restrict new orders to Paystack while preserving historical payments.
CREATE OR REPLACE FUNCTION public.create_order_with_payment(
  p_address_id uuid,
  p_delivery_method text,
  p_notes text,
  p_payment_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
  v_order_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_payment_method IS DISTINCT FROM 'paystack' THEN
    RAISE EXCEPTION 'Only Paystack Mobile Money or card payment is supported';
  END IF;
  v_result := public.create_order(p_address_id, p_delivery_method, p_notes);
  IF COALESCE((v_result ->> 'success')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Order creation failed';
  END IF;
  v_order_id := NULLIF(v_result ->> 'order_id', '')::uuid;
  IF v_order_id IS NULL THEN RAISE EXCEPTION 'Order creation returned no order ID'; END IF;
  UPDATE public.payments SET provider = 'paystack'::public.payment_method, updated_at = now()
   WHERE order_id = v_order_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Unable to persist selected Paystack payment method'; END IF;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_with_payment(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_payment(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_paystack_payment_attempt(
  p_order_id uuid,
  p_reference text,
  p_expected_status text,
  p_expected_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_payment public.payments%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_reference IS NULL OR btrim(p_reference) = '' THEN RAISE EXCEPTION 'Invalid payment reference'; END IF;
  SELECT o.* INTO v_order FROM public.orders o
   WHERE o.id = p_order_id AND o.customer_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status <> 'pending' THEN RAISE EXCEPTION 'This order is not awaiting payment'; END IF;
  IF v_order.currency <> 'GHS' OR v_order.total_amount <= 0 THEN RAISE EXCEPTION 'Invalid order amount or currency'; END IF;
  SELECT p.* INTO v_payment FROM public.payments p WHERE p.order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment record not found'; END IF;
  IF v_payment.provider <> 'paystack' THEN RAISE EXCEPTION 'Order is not configured for Paystack'; END IF;
  IF v_payment.status = 'paid' THEN RAISE EXCEPTION 'Order is already paid'; END IF;
  IF v_payment.status::text <> p_expected_status OR v_payment.provider_reference IS DISTINCT FROM p_expected_reference THEN
    RAISE EXCEPTION 'Payment state changed; refresh the order before retrying';
  END IF;
  IF v_payment.currency <> 'GHS' OR abs(v_payment.amount - v_order.total_amount) > 0.009 THEN
    RAISE EXCEPTION 'Payment amount or currency mismatch';
  END IF;
  UPDATE public.payments SET provider_reference = p_reference, status = 'processing',
    metadata = jsonb_build_object('paystack_initialization_started_at', now()), updated_at = now()
   WHERE id = v_payment.id;
  RETURN jsonb_build_object('success', true, 'reference', p_reference);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_paystack_payment_attempt(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_paystack_payment_attempt(uuid,text,text,text) TO authenticated;


-- Reset only an initialization explicitly rejected by Paystack. Keep payment
-- writes behind an authenticated, order-scoped function instead of table UPDATE.
CREATE OR REPLACE FUNCTION public.reset_paystack_payment_attempt(
  p_order_id uuid,
  p_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM 1 FROM public.orders
   WHERE id = p_order_id AND customer_id = v_user_id AND status = 'pending'
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or no longer pending'; END IF;
  UPDATE public.payments
     SET status = 'pending', provider_reference = NULL, metadata = '{}'::jsonb, updated_at = now()
   WHERE order_id = p_order_id AND provider = 'paystack'
     AND provider_reference = p_reference AND status = 'processing';
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment attempt changed and could not be reset'; END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;
REVOKE ALL ON FUNCTION public.reset_paystack_payment_attempt(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_paystack_payment_attempt(uuid,text) TO authenticated;
