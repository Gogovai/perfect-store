-- Serialize payment initialization and order cancellation using the order lock.
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_item record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT o.* INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.customer_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status NOT IN ('pending','confirmed') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled';
  END IF;

  -- Serialize cancellation with Hubtel initialization: both paths lock the order
  -- first, then the payment row. A payment in flight or already paid cannot be
  -- cancelled until the store implements a verified refund workflow.
  PERFORM 1 FROM public.payments p WHERE p.order_id = p_order_id FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.order_id = p_order_id AND p.status IN ('processing', 'paid')
  ) THEN
    RAISE EXCEPTION 'Payment is processing or already paid; contact support before cancelling';
  END IF;

  FOR v_item IN
    SELECT oi.product_id, oi.variant_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.variant_inventory
      SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity), updated_at = now()
      WHERE variant_id = v_item.variant_id;
    ELSE
      UPDATE public.inventory
      SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity), updated_at = now()
      WHERE product_id = v_item.product_id;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$function$
;
REVOKE ALL ON FUNCTION public.cancel_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_hubtel_payment_attempt(
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_reference IS NULL OR btrim(p_reference) = '' THEN
    RAISE EXCEPTION 'Invalid payment reference';
  END IF;

  -- Lock in the same order as cancel_order to prevent a cancellation racing
  -- with checkout initialization.
  SELECT o.* INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id AND o.customer_id = v_user_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status <> 'pending' THEN RAISE EXCEPTION 'This order is not awaiting payment'; END IF;
  IF v_order.currency <> 'GHS' OR v_order.total_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid order amount or currency';
  END IF;

  SELECT p.* INTO v_payment
    FROM public.payments p
   WHERE p.order_id = p_order_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment record not found'; END IF;
  IF v_payment.provider <> 'hubtel' THEN RAISE EXCEPTION 'Order is not configured for Hubtel'; END IF;
  IF v_payment.status = 'paid' THEN RAISE EXCEPTION 'Order is already paid'; END IF;
  IF v_payment.status::text <> p_expected_status
     OR v_payment.provider_reference IS DISTINCT FROM p_expected_reference THEN
    RAISE EXCEPTION 'Payment state changed; refresh the order before retrying';
  END IF;
  IF v_payment.currency <> 'GHS'
     OR abs(v_payment.amount - v_order.total_amount) > 0.009 THEN
    RAISE EXCEPTION 'Payment amount or currency mismatch';
  END IF;

  UPDATE public.payments
     SET provider_reference = p_reference,
         status = 'processing',
         metadata = jsonb_build_object('hubtel_initialization_started_at', now()),
         updated_at = now()
   WHERE id = v_payment.id;

  RETURN jsonb_build_object('success', true, 'reference', p_reference);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_hubtel_payment_attempt(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_hubtel_payment_attempt(uuid, text, text, text)
  TO authenticated;
