-- Phase 7: Order lifecycle reconciled to the production Supabase schema.
-- Payment rows are intentionally NOT created here because no payment provider
-- has been configured yet. Payment integration will be added in a later phase.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS delivery_method_name text NOT NULL DEFAULT 'Standard Delivery';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_method_check CHECK (delivery_method IN ('standard','express'));

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items (seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);

CREATE OR REPLACE FUNCTION public.create_order(
  p_address_id uuid,
  p_delivery_method text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_address public.addresses%ROWTYPE;
  v_cart_item record;
  v_product public.products%ROWTYPE;
  v_seller public.sellers%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_shipping_fee numeric(12,2);
  v_total numeric(12,2);
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_method_name text;
  v_item_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_delivery_method NOT IN ('standard','express') THEN RAISE EXCEPTION 'Invalid delivery method'; END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 500 THEN RAISE EXCEPTION 'Notes must be 500 characters or less'; END IF;

  IF p_delivery_method = 'standard' THEN
    v_method_name := 'Standard Delivery'; v_shipping_fee := 15.00;
  ELSE
    v_method_name := 'Express Delivery'; v_shipping_fee := 35.00;
  END IF;

  SELECT c.id INTO v_cart_id FROM public.carts c WHERE c.user_id = v_user_id FOR UPDATE;
  IF v_cart_id IS NULL THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

  SELECT a.* INTO v_address FROM public.addresses a WHERE a.id = p_address_id AND a.user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected delivery address is no longer available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

  FOR v_cart_item IN
    SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity
    FROM public.cart_items ci WHERE ci.cart_id = v_cart_id ORDER BY ci.id FOR UPDATE
  LOOP
    IF v_cart_item.quantity IS NULL OR v_cart_item.quantity <= 0 THEN RAISE EXCEPTION 'Invalid cart quantity'; END IF;

    SELECT p.* INTO v_product FROM public.products p WHERE p.id = v_cart_item.product_id AND p.status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'One or more products in your cart are no longer available'; END IF;

    SELECT s.* INTO v_seller FROM public.sellers s WHERE s.id = v_product.seller_id AND s.status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'One or more sellers in your cart are no longer active'; END IF;

    IF v_cart_item.variant_id IS NOT NULL THEN
      SELECT pv.* INTO v_variant FROM public.product_variants pv
      WHERE pv.id = v_cart_item.variant_id AND pv.product_id = v_cart_item.product_id AND pv.is_active = true;
      IF NOT FOUND THEN RAISE EXCEPTION 'One or more product variants in your cart are no longer available'; END IF;
      v_unit_price := COALESCE(v_variant.price, v_product.base_price);
      UPDATE public.variant_inventory
      SET reserved_quantity = reserved_quantity + v_cart_item.quantity, updated_at = now()
      WHERE variant_id = v_cart_item.variant_id AND quantity - reserved_quantity >= v_cart_item.quantity;
      IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock for one or more items in your cart'; END IF;
    ELSE
      v_unit_price := v_product.base_price;
      UPDATE public.inventory
      SET reserved_quantity = reserved_quantity + v_cart_item.quantity, updated_at = now()
      WHERE product_id = v_cart_item.product_id AND quantity - reserved_quantity >= v_cart_item.quantity;
      IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock for one or more items in your cart'; END IF;
    END IF;

    v_line_total := round(v_unit_price * v_cart_item.quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_item_count := v_item_count + 1;
  END LOOP;

  IF v_item_count = 0 THEN RAISE EXCEPTION 'Your cart is empty'; END IF;
  IF v_subtotal >= 200.00 THEN v_shipping_fee := 0.00; END IF;
  v_total := v_subtotal + v_shipping_fee;
  v_order_number := 'PS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.orders (
    id, order_number, customer_id, status, currency, subtotal, shipping_fee,
    discount_amount, total_amount, shipping_address, notes, placed_at,
    delivery_method, delivery_method_name
  ) VALUES (
    v_order_id, v_order_number, v_user_id, 'pending', 'GHS', v_subtotal,
    v_shipping_fee, 0.00, v_total,
    jsonb_build_object(
      'label', v_address.label, 'recipient_name', v_address.recipient_name, 'phone', v_address.phone,
      'address_line1', v_address.address_line1, 'address_line2', v_address.address_line2,
      'city', v_address.city, 'region', v_address.region, 'country', v_address.country,
      'postal_code', v_address.postal_code, 'delivery_instructions', v_address.delivery_instructions
    ),
    p_notes, now(), p_delivery_method, v_method_name
  );

  INSERT INTO public.order_items (
    id, order_id, seller_id, product_id, variant_id, product_name, sku, quantity, unit_price, total_price
  )
  SELECT
    gen_random_uuid(), v_order_id, p.seller_id, ci.product_id, ci.variant_id, p.name,
    CASE WHEN ci.variant_id IS NOT NULL THEN pv.sku ELSE p.sku END,
    ci.quantity,
    CASE WHEN ci.variant_id IS NOT NULL THEN COALESCE(pv.price, p.base_price) ELSE p.base_price END,
    round((CASE WHEN ci.variant_id IS NOT NULL THEN COALESCE(pv.price, p.base_price) ELSE p.base_price END) * ci.quantity, 2)
  FROM public.cart_items ci
  JOIN public.products p ON p.id = ci.product_id
  LEFT JOIN public.product_variants pv ON pv.id = ci.variant_id
  WHERE ci.cart_id = v_cart_id;

  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'order_number', v_order_number);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_item record;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT o.* INTO v_order FROM public.orders o
  WHERE o.id = p_order_id AND o.customer_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'This order can no longer be cancelled'; END IF;

  FOR v_item IN SELECT oi.product_id, oi.variant_id, oi.quantity FROM public.order_items oi WHERE oi.order_id = p_order_id LOOP
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

  UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;
  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.create_order(uuid,uuid,text,text);
DROP FUNCTION IF EXISTS public.cancel_order(uuid,uuid);
