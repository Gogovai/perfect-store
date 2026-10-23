-- Support city, region and Ghana-wide zones in the database order path.
-- The function definition is based on the currently deployed single-store version,
-- preserving stock reservation, clothing checks, payment row creation and notifications.
CREATE OR REPLACE FUNCTION public.create_order(p_address_id uuid, p_delivery_method text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_address public.addresses%ROWTYPE;
  v_cart_item record;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_shipping_fee numeric(12,2);
  v_total numeric(12,2);
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_method_name text;
  v_shipping_rate record;
  v_item_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_delivery_method IS NULL OR lower(btrim(p_delivery_method)) NOT IN ('standard', 'express') THEN RAISE EXCEPTION 'Invalid delivery method'; END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 500 THEN RAISE EXCEPTION 'Notes must be 500 characters or less'; END IF;

  SELECT c.id INTO v_cart_id FROM public.carts c WHERE c.user_id = v_user_id FOR UPDATE;
  IF v_cart_id IS NULL THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

  SELECT a.* INTO v_address FROM public.addresses a WHERE a.id = p_address_id AND a.user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected delivery address is no longer available'; END IF;
  IF lower(btrim(COALESCE(v_address.country, ''))) NOT IN ('ghana', 'gh') THEN RAISE EXCEPTION 'Delivery is only available within Ghana'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

  FOR v_cart_item IN
    SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity
    FROM public.cart_items ci WHERE ci.cart_id = v_cart_id ORDER BY ci.id FOR UPDATE
  LOOP
    IF v_cart_item.quantity IS NULL OR v_cart_item.quantity < 1 OR v_cart_item.quantity > 99 THEN RAISE EXCEPTION 'Invalid cart quantity'; END IF;

    SELECT p.* INTO v_product FROM public.products p WHERE p.id = v_cart_item.product_id AND p.status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'One or more products in your cart are no longer available'; END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.categories c
       WHERE c.id = v_product.category_id
         AND c.is_active = true
         AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~* '\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\M'
    ) THEN
      RAISE EXCEPTION 'This store only sells clothing, footwear, and fashion accessories';
    END IF;

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
  SELECT sr.price, sr.method, dz.name, dz.city
    INTO v_shipping_rate
    FROM public.shipping_rates sr
    JOIN public.delivery_zones dz ON dz.id = sr.zone_id
   WHERE sr.is_active = true
     AND dz.is_active = true
     AND lower(btrim(sr.method)) = lower(btrim(p_delivery_method))
     AND (
       (NULLIF(btrim(COALESCE(dz.city, '')), '') IS NOT NULL
         AND lower(btrim(dz.city)) = lower(btrim(COALESCE(v_address.city, ''))))
       OR
       (NULLIF(btrim(COALESCE(dz.city, '')), '') IS NULL
         AND (
           (NULLIF(btrim(COALESCE(dz.region, '')), '') IS NOT NULL
             AND lower(btrim(dz.region)) = lower(btrim(COALESCE(v_address.region, ''))))
           OR NULLIF(btrim(COALESCE(dz.region, '')), '') IS NULL
         ))
     )
   ORDER BY CASE
              WHEN NULLIF(btrim(COALESCE(dz.city, '')), '') IS NOT NULL THEN 0
              WHEN NULLIF(btrim(COALESCE(dz.region, '')), '') IS NOT NULL THEN 1
              ELSE 2
            END,
            sr.price ASC
   LIMIT 1;
  IF NOT FOUND THEN
    -- Preserve the currently deployed checkout behavior until the owner configures
    -- real delivery zones/rates. Once any rates are configured, an unmatched
    -- address/method is rejected instead of silently using a guessed rate.
    IF EXISTS (SELECT 1 FROM public.shipping_rates WHERE is_active = true) THEN
      RAISE EXCEPTION 'No delivery rate configured for selected address and method';
    END IF;
    v_shipping_fee := CASE WHEN lower(btrim(p_delivery_method)) = 'express' THEN 35.00 ELSE 15.00 END;
    v_method_name := initcap(replace(replace(p_delivery_method, '_', ' '), '-', ' ')) || ' Delivery';
  ELSE
    v_shipping_fee := v_shipping_rate.price;
    v_method_name := initcap(replace(replace(v_shipping_rate.method, '_', ' '), '-', ' ')) || ' Delivery';
  END IF;

  -- Keep the existing GHS 200 free-delivery threshold until an explicit store
  -- policy replaces it; configured rates still control all other deliveries.
  IF v_subtotal >= 200 THEN v_shipping_fee := 0; END IF;
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

  -- Keep the payment row and order notification atomic with order creation.
  -- Checkout immediately updates the pending provider to the shopper's chosen method.
  INSERT INTO public.payments (order_id, provider, status, amount, currency, metadata)
  VALUES (v_order_id, 'hubtel', 'pending', v_total, 'GHS', '{}'::jsonb)
  ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    v_user_id,
    'Order received',
    'Your order ' || v_order_number || ' has been received.',
    'order_status',
    jsonb_build_object('order_id', v_order_id)
  );

  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'order_number', v_order_number);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_order(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text, text) TO authenticated;
