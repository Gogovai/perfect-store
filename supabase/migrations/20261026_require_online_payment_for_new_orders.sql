-- Require online Hubtel payment for every newly created order.
-- Existing historical cash-on-delivery payment records are preserved.
BEGIN;

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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_payment_method IS DISTINCT FROM 'hubtel' THEN
    RAISE EXCEPTION 'Only online Mobile Money or card payment is supported';
  END IF;

  v_result := public.create_order(p_address_id, p_delivery_method, p_notes);
  IF COALESCE((v_result ->> 'success')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Order creation failed';
  END IF;

  v_order_id := NULLIF(v_result ->> 'order_id', '')::uuid;
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Order creation returned no order ID';
  END IF;

  UPDATE public.payments
     SET provider = 'hubtel'::public.payment_method,
         updated_at = now()
   WHERE order_id = v_order_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to persist the selected online payment method';
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_payment(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_payment(uuid, text, text, text)
  TO authenticated;

COMMIT;
