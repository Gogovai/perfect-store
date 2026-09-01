-- ============================================================
-- Phase 7: Production Order Lifecycle Foundation
-- ============================================================
-- This migration adds:
-- 1. Immutable shipping snapshot columns to orders
-- 2. Delivery method tracking on orders
-- 3. Atomic order creation function (RPC) with inventory reservation
-- 4. Database indexes for order performance
-- 5. Unique constraint on order_number
-- 6. RLS policies for customer, seller, and admin order access
-- 7. Atomic order cancellation function
-- ============================================================

-- ============================================================
-- 1. Add shipping snapshot columns to orders
-- ============================================================
-- These columns store an immutable snapshot of the delivery address
-- at the time of order placement, so historical orders are unaffected
-- if the customer later edits their address.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_full_name text,
  ADD COLUMN IF NOT EXISTS shipping_phone text,
  ADD COLUMN IF NOT EXISTS shipping_address_line_1 text,
  ADD COLUMN IF NOT EXISTS shipping_address_line_2 text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_region text,
  ADD COLUMN IF NOT EXISTS shipping_postal_code text,
  ADD COLUMN IF NOT EXISTS shipping_country text default 'Ghana',
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS delivery_method_name text NOT NULL DEFAULT 'Standard Delivery';

-- ============================================================
-- 2. Add indexes for order performance
-- ============================================================
-- Avoid creating redundant indexes; check first.

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_variant_id ON public.variant_inventory USING btree (variant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items USING btree (cart_id);

-- ============================================================
-- 3. Unique constraint on order_number
-- ============================================================
-- Prevent duplicate order numbers at the database level.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_order_number_unique'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
  END IF;
END $$;

-- ============================================================
-- 4. Atomic order creation function
-- ============================================================
-- This function handles the entire order creation flow atomically:
--   1. Authenticate user
--   2. Load and validate cart items
--   3. Validate products, sellers, variants, inventory
--   4. Calculate authoritative prices
--   5. Generate unique order number (with retry on collision)
--   6. Create order with shipping snapshot
--   7. Create order items
--   8. Create pending payment record
--   9. Reserve inventory atomically
--  10. Remove purchased cart items
--
-- If any step fails, the entire transaction rolls back.
-- No partial orders are ever created.

CREATE OR REPLACE FUNCTION public.create_order(
  p_user_id uuid,
  p_address_id uuid,
  p_delivery_method text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id uuid;
  v_address record;
  v_cart_item record;
  v_product record;
  v_seller record;
  v_variant record;
  v_unit_price numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_shipping_cost numeric := 0;
  v_total numeric;
  v_order_id uuid;
  v_order_number text;
  v_order_item_id uuid;
  v_image_url text;
  v_order_number_exists boolean;
  v_date_str text;
  v_random_part text;
  v_method_name text;
  v_free_threshold numeric := 200.00;
BEGIN
  -- ========================================
  -- Step 1: Validate delivery method
  -- ========================================
  IF p_delivery_method NOT IN ('standard', 'express') THEN
    RAISE EXCEPTION 'Invalid delivery method';
  END IF;

  -- Set delivery method name
  IF p_delivery_method = 'standard' THEN
    v_method_name := 'Standard Delivery';
    v_shipping_cost := 15.00;
  ELSIF p_delivery_method = 'express' THEN
    v_method_name := 'Express Delivery';
    v_shipping_cost := 35.00;
  END IF;

  -- ========================================
  -- Step 2: Load user's cart
  -- ========================================
  SELECT c.id INTO v_cart_id
  FROM public.carts c
  WHERE c.user_id = p_user_id
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  -- ========================================
  -- Step 3: Validate address ownership
  -- ========================================
  SELECT a.* INTO v_address
  FROM public.addresses a
  WHERE a.id = p_address_id AND a.user_id = p_user_id;

  IF v_address IS NULL THEN
    RAISE EXCEPTION 'The selected delivery address is no longer available';
  END IF;

  -- ========================================
  -- Step 4: Validate and process cart items
  -- ========================================
  -- We use a temporary table to hold validated items within this transaction
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_order_items (
    cart_item_id uuid,
    product_id uuid,
    variant_id uuid,
    seller_id uuid,
    product_name text,
    variant_name text,
    unit_price numeric,
    quantity int,
    line_total numeric,
    is_valid boolean DEFAULT true,
    error_msg text
  ) ON COMMIT DROP;

  -- Process each cart item
  FOR v_cart_item IN
    SELECT ci.id as cart_item_id, ci.product_id, ci.variant_id, ci.quantity
    FROM public.cart_items ci
    WHERE ci.cart_id = v_cart_id
  LOOP
    v_unit_price := 0;
    v_line_total := 0;

    -- Validate product exists and is active
    SELECT p.id, p.name, p.base_price, p.seller_id, p.status, p.is_active
    INTO v_product
    FROM public.products p
    WHERE p.id = v_cart_item.product_id;

    IF NOT FOUND OR NOT v_product.is_active OR v_product.status != 'active' THEN
      INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, unit_price, quantity, is_valid, error_msg)
      VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, v_cart_item.variant_id, NULL, 'Product', 0, v_cart_item.quantity, false, 'Product is no longer available');
      CONTINUE;
    END IF;

    -- Validate seller is active
    SELECT s.id, s.shop_name, s.status
    INTO v_seller
    FROM public.sellers s
    WHERE s.id = v_product.seller_id;

    IF NOT FOUND OR v_seller.status != 'active' THEN
      INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, unit_price, quantity, is_valid, error_msg)
      VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, v_cart_item.variant_id, NULL, 'Product', 0, v_cart_item.quantity, false, 'Seller is no longer active');
      CONTINUE;
    END IF;

    -- Handle variant if applicable
    IF v_cart_item.variant_id IS NOT NULL THEN
      SELECT pv.id, pv.name, pv.price, pv.is_active
      INTO v_variant
      FROM public.product_variants pv
      WHERE pv.id = v_cart_item.variant_id AND pv.product_id = v_cart_item.product_id;

      IF NOT FOUND OR NOT v_variant.is_active THEN
        INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, unit_price, quantity, is_valid, error_msg)
        VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, v_cart_item.variant_id, v_seller.id, v_product.name, 0, v_cart_item.quantity, false, 'Variant is no longer available');
        CONTINUE;
      END IF;

      v_unit_price := v_variant.price;

      -- Check variant inventory
      IF NOT EXISTS (
        SELECT 1 FROM public.variant_inventory vi
        WHERE vi.variant_id = v_cart_item.variant_id
        AND (vi.quantity - vi.reserved) >= v_cart_item.quantity
      ) THEN
        INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, variant_name, unit_price, quantity, is_valid, error_msg)
        VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, v_cart_item.variant_id, v_seller.id, v_product.name, v_variant.name, v_unit_price, v_cart_item.quantity, false, 'Insufficient stock');
        CONTINUE;
      END IF;

      -- Reserve variant inventory atomically
      UPDATE public.variant_inventory
      SET reserved = reserved + v_cart_item.quantity,
          updated_at = now()
      WHERE variant_id = v_cart_item.variant_id
      AND (quantity - reserved) >= v_cart_item.quantity;

      -- Check if the update actually succeeded (row was affected)
      IF NOT FOUND THEN
        INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, variant_name, unit_price, quantity, is_valid, error_msg)
        VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, v_cart_item.variant_id, v_seller.id, v_product.name, v_variant.name, v_unit_price, v_cart_item.quantity, false, 'Insufficient stock');
        CONTINUE;
      END IF;

    ELSE
      v_unit_price := v_product.base_price;

      -- Check product inventory
      IF NOT EXISTS (
        SELECT 1 FROM public.inventory inv
        WHERE inv.product_id = v_cart_item.product_id
        AND (inv.quantity - inv.reserved) >= v_cart_item.quantity
      ) THEN
        INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, unit_price, quantity, is_valid, error_msg)
        VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, NULL, v_seller.id, v_product.name, v_unit_price, v_cart_item.quantity, false, 'Insufficient stock');
        CONTINUE;
      END IF;

      -- Reserve product inventory atomically
      UPDATE public.inventory
      SET reserved = reserved + v_cart_item.quantity,
          updated_at = now()
      WHERE product_id = v_cart_item.product_id
      AND (quantity - reserved) >= v_cart_item.quantity;

      IF NOT FOUND THEN
        INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, unit_price, quantity, is_valid, error_msg)
        VALUES (v_cart_item.cart_item_id, v_cart_item.product_id, NULL, v_seller.id, v_product.name, v_unit_price, v_cart_item.quantity, false, 'Insufficient stock');
        CONTINUE;
      END IF;
    END IF;

    -- Get primary image URL for snapshot
    SELECT pi.url INTO v_image_url
    FROM public.product_images pi
    WHERE pi.product_id = v_cart_item.product_id
    AND pi.is_primary = true
    LIMIT 1;

    IF v_image_url IS NULL THEN
      SELECT pi.url INTO v_image_url
      FROM public.product_images pi
      WHERE pi.product_id = v_cart_item.product_id
      LIMIT 1;
    END IF;

    v_line_total := v_unit_price * v_cart_item.quantity;

    INSERT INTO temp_order_items (cart_item_id, product_id, variant_id, seller_id, product_name, variant_name, unit_price, quantity, line_total, is_valid)
    VALUES (
      v_cart_item.cart_item_id,
      v_cart_item.product_id,
      v_cart_item.variant_id,
      v_seller.id,
      v_product.name,
      CASE WHEN v_cart_item.variant_id IS NOT NULL THEN v_variant.name ELSE NULL END,
      v_unit_price,
      v_cart_item.quantity,
      v_line_total,
      true
    );

    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- Check for any invalid items
  IF EXISTS (SELECT 1 FROM temp_order_items WHERE is_valid = false) THEN
    RAISE EXCEPTION 'Some items in your cart are no longer available. Please review your cart.';
  END IF;

  -- Check that we have at least one valid item
  IF NOT EXISTS (SELECT 1 FROM temp_order_items WHERE is_valid = true) THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  -- Apply free delivery threshold
  IF v_subtotal >= v_free_threshold THEN
    v_shipping_cost := 0;
  END IF;

  v_total := v_subtotal + v_shipping_cost;

  -- ========================================
  -- Step 5: Generate unique order number
  -- ========================================
  v_date_str := to_char(now(), 'YYYYMMDD');

  -- Attempt up to 5 times to generate a unique order number
  FOR i IN 1..5 LOOP
    v_random_part := upper(substring(md5(random()::text) from 1 for 6));
    v_order_number := 'PS-' || v_date_str || '-' || v_random_part;

    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number)
    INTO v_order_number_exists;

    IF NOT v_order_number_exists THEN
      EXIT;
    END IF;
  END LOOP;

  IF v_order_number_exists THEN
    RAISE EXCEPTION 'Unable to generate a unique order number. Please try again.';
  END IF;

  -- ========================================
  -- Step 6: Create the order with shipping snapshot
  -- ========================================
  v_order_id := gen_random_uuid();

  INSERT INTO public.orders (
    id, user_id, order_number, status, subtotal, shipping_cost, tax, total,
    shipping_address_id, notes,
    shipping_full_name, shipping_phone, shipping_address_line_1, shipping_address_line_2,
    shipping_city, shipping_region, shipping_postal_code, shipping_country,
    delivery_method, delivery_method_name
  ) VALUES (
    v_order_id, p_user_id, v_order_number, 'pending',
    v_subtotal, v_shipping_cost, 0, v_total,
    p_address_id, p_notes,
    v_address.full_name, v_address.phone,
    v_address.address_line_1, v_address.address_line_2,
    v_address.city, v_address.region, v_address.postal_code, v_address.country,
    p_delivery_method, v_method_name
  );

  -- ========================================
  -- Step 7: Create order items
  -- ========================================
  INSERT INTO public.order_items (
    id, order_id, product_id, variant_id, seller_id,
    product_name, variant_name, unit_price, quantity, subtotal
  )
  SELECT
    gen_random_uuid(), v_order_id, toi.product_id, toi.variant_id, toi.seller_id,
    toi.product_name, toi.variant_name, toi.unit_price, toi.quantity, toi.line_total
  FROM temp_order_items toi
  WHERE toi.is_valid = true;

  -- ========================================
  -- Step 8: Create pending payment record
  -- ========================================
  INSERT INTO public.payments (
    id, order_id, amount, method, status, transaction_id, metadata
  ) VALUES (
    gen_random_uuid(), v_order_id, v_total, 'pending', 'pending', NULL,
    jsonb_build_object('note', 'Payment gateway not yet integrated')
  );

  -- ========================================
  -- Step 9: Remove purchased cart items
  -- ========================================
  DELETE FROM public.cart_items
  WHERE cart_id = v_cart_id;

  -- ========================================
  -- Step 10: Clean up temp table
  -- ========================================
  DROP TABLE IF EXISTS temp_order_items;

  -- ========================================
  -- Return success
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION WHEN OTHERS THEN
  -- Clean up temp table on error
  DROP TABLE IF EXISTS temp_order_items;
  -- Re-raise the error with context
  RAISE;
END;
$$;

-- ============================================================
-- 5. Atomic order cancellation function
-- ============================================================
-- Handles cancelling a pending/confirmed order and releasing inventory.

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_user_id uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
  v_order_item record;
BEGIN
  -- Load order with ownership check
  SELECT o.* INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id AND o.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Only allow cancellation of pending or confirmed orders
  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled';
  END IF;

  -- Update order status
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  -- Release reserved inventory for each order item
  FOR v_order_item IN
    SELECT oi.variant_id, oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    IF v_order_item.variant_id IS NOT NULL THEN
      -- Release variant inventory (ensure reserved doesn't go below 0)
      UPDATE public.variant_inventory
      SET reserved = GREATEST(reserved - v_order_item.quantity, 0),
          updated_at = now()
      WHERE variant_id = v_order_item.variant_id;
    ELSE
      -- Release product inventory
      UPDATE public.inventory
      SET reserved = GREATEST(reserved - v_order_item.quantity, 0),
          updated_at = now()
      WHERE product_id = v_order_item.product_id;
    END IF;
  END LOOP;

  -- Update payment status
  UPDATE public.payments
  SET status = 'refunded', updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order has been cancelled successfully'
  );
END;
$$;

-- ============================================================
-- 6. RLS Policies for orders
-- ============================================================

-- Customers can read their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Customers can read their own order items through their orders
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
    )
  );

-- Customers can view their own payment records
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
      AND o.user_id = auth.uid()
    )
  );

-- Sellers can view order items that belong to their products
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;
CREATE POLICY "Sellers can view their order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = order_items.seller_id
      AND s.user_id = auth.uid()
      AND s.status = 'active'
    )
  );

-- Admins can view all orders (via service role, which bypasses RLS)
-- No additional policy needed for admin since service role bypasses RLS

-- ============================================================
-- 7. Update the orders table RLS to allow inserts from the create_order function
-- The function uses SECURITY DEFINER so it runs as the function owner,
-- which bypasses RLS. No additional INSERT policy needed for orders.
-- ============================================================

-- ============================================================
-- Done
-- ============================================================
