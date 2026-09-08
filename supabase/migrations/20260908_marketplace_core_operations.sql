-- Marketplace core operations: admin product creation, commission rules,
-- advertising payment, inventory hardening, and seller payout lifecycle.

-- ============================================================
-- 1. MARKETPLACE SETTINGS & COMMISSION RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Default commission: 10% platform commission
INSERT INTO public.marketplace_settings (setting_key, setting_value, description)
VALUES ('commission_rules', '{"default_rate": 10, "categories": {}}'::jsonb, 'Platform commission configuration')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_settings_admin ON public.marketplace_settings
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY marketplace_settings_public ON public.marketplace_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- ============================================================
-- 2. ADMIN PRODUCT CREATION (platform-owned products)
-- ============================================================

-- Add owner_type to distinguish admin-owned vs seller-owned products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS owner_type text NOT NULL DEFAULT 'seller'
  CHECK (owner_type IN ('seller', 'admin', 'platform'));

-- Add created_by to track who created the product
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- ============================================================
-- 3. ADVERTISING PAYMENT SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ad_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'GHS',
  provider text NOT NULL DEFAULT 'paystack',
  provider_reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  metadata jsonb NOT NULL DEFAULT '{}',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_payments_ad ON public.ad_payments(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_seller ON public.ad_payments(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_payments_ref ON public.ad_payments(provider_reference) WHERE provider_reference IS NOT NULL;

ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_payments_seller ON public.ad_payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY ad_payments_admin ON public.ad_payments
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ============================================================
-- 4. ADVERTISING PLACEMENT INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  default_price numeric NOT NULL DEFAULT 0 CHECK (default_price >= 0),
  default_duration_days integer NOT NULL DEFAULT 7,
  max_active_slots integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default placements
INSERT INTO public.ad_placements (placement_key, name, description, default_price, default_duration_days, max_active_slots) VALUES
  ('home_hero', 'Homepage Hero Banner', 'Featured banner on homepage', 500.00, 7, 3),
  ('home_featured', 'Homepage Featured Products', 'Featured product grid on homepage', 300.00, 7, 6),
  ('category_featured', 'Category Featured Products', 'Featured products within category pages', 200.00, 14, 4),
  ('search_sponsored', 'Sponsored Search Results', 'Products appearing as sponsored in search', 150.00, 14, 5),
  ('flash_sale', 'Flash Sale Placement', 'Products in flash sale section', 250.00, 3, 10)
ON CONFLICT (placement_key) DO NOTHING;

ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_placements_public ON public.ad_placements
  FOR SELECT TO anon, authenticated
  USING (is_active);

CREATE POLICY ad_placements_admin ON public.ad_placements
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ============================================================
-- 5. FLASH SALE SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  promotional_price numeric NOT NULL CHECK (promotional_price > 0),
  original_price numeric NOT NULL CHECK (original_price > 0),
  stock_reserved integer NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  placement text NOT NULL DEFAULT 'flash_sale',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'payment_pending', 'pending_review', 'active', 'expired', 'paused', 'rejected')),
  payment_id uuid REFERENCES public.ad_payments(id),
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_status ON public.flash_sales(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON public.flash_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_seller ON public.flash_sales(seller_id);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY flash_sales_public ON public.flash_sales
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND starts_at <= now() AND ends_at > now());

CREATE POLICY flash_sales_seller ON public.flash_sales
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY flash_sales_admin ON public.flash_sales
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ============================================================
-- 6. SELLER PAYOUT LIFECYCLE
-- ============================================================

-- Enhance seller_payouts with proper payout lifecycle
ALTER TABLE public.seller_payouts
  ADD COLUMN IF NOT EXISTS gross_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency char(3) NOT NULL DEFAULT 'GHS',
  ADD COLUMN IF NOT EXISTS payout_method text DEFAULT 'bank_transfer'
    CHECK (payout_method IN ('bank_transfer', 'mobile_money', 'bank')),
  ADD COLUMN IF NOT EXISTS payout_reference text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- ============================================================
-- 7. AUDIT LOG ENHANCEMENT
-- ============================================================

-- Add ip_address and user_agent columns if not present
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- ============================================================
-- 8. MARKETPLACE MONEY LEDGER (immutable transaction records)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  transaction_type text NOT NULL
    CHECK (transaction_type IN ('sale', 'commission', 'refund', 'payout', 'ad_payment', 'adjustment')),
  gross_amount numeric NOT NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  shipping_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  fee_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  currency char(3) NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'reversed', 'failed')),
  description text,
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_txn_reference
  ON public.marketplace_transactions(reference) WHERE reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_txn_order ON public.marketplace_transactions(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_txn_seller ON public.marketplace_transactions(seller_id, created_at DESC);

ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_txn_seller ON public.marketplace_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY marketplace_txn_admin ON public.marketplace_transactions
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ============================================================
-- 9. INVENTORY HARDENING
-- ============================================================

-- Ensure inventory records exist for all active products
-- This trigger creates an inventory record when a product becomes active
CREATE OR REPLACE FUNCTION public.ensure_product_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    INSERT INTO public.inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
    VALUES (NEW.id, 0, 0, 5)
    ON CONFLICT (product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_ensure_product_inventory ON public.products;
CREATE TRIGGER trg_ensure_product_inventory
  AFTER INSERT OR UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_product_inventory();

-- ============================================================
-- 10. FLASH SALE AUTO-EXPIRATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.expire_flash_sales()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
BEGIN
  UPDATE public.flash_sales
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND ends_at < now();
END;
$func$;

-- ============================================================
-- 11. SELLER NOTIFICATION ON PRODUCT STATUS CHANGE
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_product_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
  v_owner uuid;
  v_seller_name text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT s.owner_id, s.store_name INTO v_owner, v_seller_name
  FROM public.sellers s WHERE s.id = NEW.seller_id;

  IF v_owner IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_owner,
    'product_status',
    CASE NEW.status
      WHEN 'active' THEN 'Product approved'
      WHEN 'rejected' THEN 'Product rejected'
      WHEN 'inactive' THEN 'Product deactivated'
      ELSE 'Product status updated'
    END,
    CASE NEW.status
      WHEN 'active' THEN NEW.name || ' is now live in the marketplace.'
      WHEN 'rejected' THEN NEW.name || ' was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided.')
      WHEN 'inactive' THEN NEW.name || ' has been deactivated and is no longer visible.'
      ELSE NEW.name || ' status changed to ' || NEW.status || '.'
    END,
    jsonb_build_object('product_id', NEW.id, 'status', NEW.status, 'old_status', OLD.status)
  );

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_notify_product_status ON public.products;
CREATE TRIGGER trg_notify_product_status
  AFTER UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_product_status_change();

-- ============================================================
-- 12. SELLER ORDER GROUPS TABLE (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seller_order_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_order_groups_order ON public.seller_order_groups(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_order_groups_seller ON public.seller_order_groups(seller_id, status);

ALTER TABLE public.seller_order_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY seller_order_groups_seller ON public.seller_order_groups
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY seller_order_groups_admin ON public.seller_order_groups
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ============================================================
-- 13. SELLER SET ORDER STATUS RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.seller_set_order_status(
  p_order_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_seller_id uuid;
  v_seller_status text;
  v_group record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT s.id, s.status INTO v_seller_id, v_seller_status
  FROM public.sellers s WHERE s.owner_id = v_user;

  IF v_seller_id IS NULL THEN RAISE EXCEPTION 'Seller account not found'; END IF;
  IF v_seller_status != 'active' THEN RAISE EXCEPTION 'Seller account is not active'; END IF;

  IF p_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status';
  END IF;

  SELECT * INTO v_group FROM public.seller_order_groups
  WHERE order_id = p_order_id AND seller_id = v_seller_id FOR UPDATE;

  IF v_group IS NULL THEN RAISE EXCEPTION 'Order not found for this seller'; END IF;

  UPDATE public.seller_order_groups
  SET status = p_status, updated_at = now()
  WHERE id = v_group.id;

  -- Sync aggregate order status from all seller groups
  PERFORM public.sync_order_status_from_seller_groups(p_order_id);

  -- Notify customer
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT o.customer_id, 'order_status', 'Order status updated',
    'Seller ' || (SELECT store_name FROM public.sellers WHERE id = v_seller_id) ||
    ' marked their portion as ' || replace(p_status, '_', ' ') || '.',
    jsonb_build_object('order_id', p_order_id, 'seller_id', v_seller_id, 'status', p_status)
  FROM public.orders o WHERE o.id = p_order_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (v_user, 'seller_order_status_updated', 'order', p_order_id,
    jsonb_build_object('status', v_group.status),
    jsonb_build_object('status', p_status, 'seller_id', v_seller_id));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Helper to sync aggregate order status
CREATE OR REPLACE FUNCTION public.sync_order_status_from_seller_groups(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_all_status text;
  v_any_processing boolean;
  v_any_shipped boolean;
  v_any_delivered boolean;
  v_all_delivered boolean;
  v_any_cancelled boolean;
BEGIN
  SELECT
    bool_or(status = 'processing'),
    bool_or(status = 'shipped'),
    bool_or(status = 'delivered'),
    bool_and(status = 'delivered'),
    bool_or(status = 'cancelled')
  INTO v_any_processing, v_any_shipped, v_any_delivered, v_all_delivered, v_any_cancelled
  FROM public.seller_order_groups
  WHERE order_id = p_order_id;

  IF v_all_delivered THEN
    UPDATE public.orders SET status = 'delivered', updated_at = now() WHERE id = p_order_id AND status != 'delivered';
  ELSIF v_any_shipped THEN
    UPDATE public.orders SET status = 'shipped', updated_at = now() WHERE id = p_order_id AND status NOT IN ('shipped', 'delivered', 'cancelled');
  ELSIF v_any_processing THEN
    UPDATE public.orders SET status = 'processing', updated_at = now() WHERE id = p_order_id AND status NOT IN ('processing', 'shipped', 'delivered', 'cancelled');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.seller_set_order_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_set_order_status(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_order_status_from_seller_groups(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_order_status_from_seller_groups(uuid) TO authenticated;

-- ============================================================
-- 14. ADMIN CREATE MARKETPLACE PRODUCT RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_create_product(
  p_name text,
  p_slug text,
  p_category_id uuid,
  p_description text DEFAULT NULL,
  p_short_description text DEFAULT NULL,
  p_sku text DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_price numeric DEFAULT 0,
  p_compare_at_price numeric DEFAULT NULL,
  p_quantity integer DEFAULT 0,
  p_image_url text DEFAULT NULL,
  p_is_featured boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_product_id uuid;
  v_admin_seller_id uuid;
BEGIN
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;

  -- Get or create the platform admin seller record
  SELECT id INTO v_admin_seller_id FROM public.sellers
  WHERE owner_id = v_user AND status = 'active' LIMIT 1;

  IF v_admin_seller_id IS NULL THEN
    -- Create a platform admin seller record
    INSERT INTO public.sellers (owner_id, store_name, slug, status, commission_rate)
    VALUES (v_user, 'Marketplace Admin', 'marketplace-admin-' || substr(v_user::text, 1, 8), 'active', 0)
    RETURNING id INTO v_admin_seller_id;
  END IF;

  -- Validate category
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND is_active = true) THEN
    RAISE EXCEPTION 'Invalid or inactive category';
  END IF;

  -- Create the product
  INSERT INTO public.products (
    seller_id, category_id, name, slug, description, short_description,
    sku, brand, base_price, compare_at_price, status, currency,
    is_featured, owner_type, created_by
  ) VALUES (
    v_admin_seller_id, p_category_id, trim(p_name), trim(p_slug),
    nullif(trim(p_description), ''), nullif(trim(p_short_description), ''),
    nullif(trim(p_sku), ''), nullif(trim(p_brand), ''),
    p_price, p_compare_at_price, 'active', 'GHS',
    p_is_featured, 'admin', v_user
  ) RETURNING id INTO v_product_id;

  -- Create inventory
  INSERT INTO public.inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
  VALUES (v_product_id, p_quantity, 0, 5);

  -- Create product image if provided
  IF p_image_url IS NOT NULL AND length(trim(p_image_url)) > 0 THEN
    INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary)
    VALUES (v_product_id, trim(p_image_url), p_name, 0, true);
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (v_user, 'admin_product_created', 'product', v_product_id,
    jsonb_build_object('name', p_name, 'category_id', p_category_id, 'price', p_price));

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_product(text,text,uuid,text,text,text,text,numeric,numeric,integer,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_product(text,text,uuid,text,text,text,text,numeric,numeric,integer,text,boolean) TO authenticated;

-- ============================================================
-- 15. SELLER ADVERTISEMENT PAYMENT RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_ad_payment(
  p_advertisement_id uuid,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_seller_id uuid;
  v_ad record;
  v_payment_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT s.id INTO v_seller_id FROM public.sellers s
  WHERE s.owner_id = v_user AND s.status = 'active';

  IF v_seller_id IS NULL THEN RAISE EXCEPTION 'Active seller account required'; END IF;

  SELECT * INTO v_ad FROM public.advertisements
  WHERE id = p_advertisement_id AND seller_id = v_seller_id AND status IN ('draft', 'payment_pending');

  IF v_ad IS NULL THEN RAISE EXCEPTION 'Advertisement not found or not eligible for payment'; END IF;

  IF p_amount <= 0 THEN RAISE EXCEPTION 'Payment amount must be positive'; END IF;

  -- Prevent duplicate payment
  IF EXISTS (SELECT 1 FROM public.ad_payments WHERE advertisement_id = p_advertisement_id AND status IN ('paid', 'processing')) THEN
    RAISE EXCEPTION 'Payment already in progress or completed';
  END IF;

  INSERT INTO public.ad_payments (advertisement_id, seller_id, amount, currency, status)
  VALUES (p_advertisement_id, v_seller_id, p_amount, 'GHS', 'pending')
  RETURNING id INTO v_payment_id;

  UPDATE public.advertisements
  SET status = 'payment_pending', updated_at = now()
  WHERE id = p_advertisement_id;

  RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_ad_payment(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ad_payment(uuid, numeric) TO authenticated;

-- ============================================================
-- 16. COMMISSION CALCULATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_commission(
  p_seller_id uuid,
  p_amount numeric,
  p_category_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rate numeric;
  v_rules jsonb;
BEGIN
  -- Get commission rules from marketplace settings
  SELECT setting_value INTO v_rules
  FROM public.marketplace_settings
  WHERE setting_key = 'commission_rules';

  IF v_rules IS NULL THEN
    -- Default 10% commission
    RETURN round(p_amount * 10 / 100, 2);
  END IF;

  -- Check for category-specific rate
  IF p_category_id IS NOT NULL THEN
    v_rate := (v_rules->'categories'->> p_category_id::text)::numeric;
    IF v_rate IS NOT NULL THEN
      RETURN round(p_amount * v_rate / 100, 2);
    END IF;
  END IF;

  -- Use default rate
  v_rate := (v_rules->>'default_rate')::numeric;
  IF v_rate IS NULL THEN v_rate := 10; END IF;

  RETURN round(p_amount * v_rate / 100, 2);
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_commission(uuid, numeric, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_commission(uuid, numeric, uuid) TO anon, authenticated;

-- ============================================================
-- 17. ENHANCED FINANCE TRIGGER (commission uses configurable rate)
-- ============================================================

CREATE OR REPLACE FUNCTION public.on_order_status_finance_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  x record;
  v_commission numeric;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'delivered' THEN
    FOR x IN
      SELECT oi.id, oi.seller_id, oi.quantity, oi.total_price, p.category_id
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Use configurable commission rate
      v_commission := public.calculate_commission(x.seller_id, x.total_price, x.category_id);

      INSERT INTO public.seller_ledger_entries (seller_id, order_item_id, entry_type, amount, currency, description, reference)
      SELECT x.seller_id, x.id, 'sale', x.total_price, NEW.currency, 'Delivered order sale', x.id::text || ':sale'
      WHERE NOT EXISTS (SELECT 1 FROM public.seller_ledger_entries e WHERE e.reference = x.id::text || ':sale');

      IF v_commission > 0 THEN
        INSERT INTO public.seller_ledger_entries (seller_id, order_item_id, entry_type, amount, currency, description, reference)
        SELECT x.seller_id, x.id, 'commission', -v_commission, NEW.currency, 'Marketplace commission', x.id::text || ':commission'
        WHERE NOT EXISTS (SELECT 1 FROM public.seller_ledger_entries e WHERE e.reference = x.id::text || ':commission');
      END IF;

      -- Create marketplace transaction record
      INSERT INTO public.marketplace_transactions (
        order_id, order_item_id, seller_id, product_id,
        transaction_type, gross_amount, commission_amount, net_amount,
        currency, description, reference
      ) VALUES (
        NEW.id, x.id, x.seller_id, x.product_id,
        'sale', x.total_price, v_commission, x.total_price - v_commission,
        NEW.currency, 'Delivered order', x.id::text || ':txn'
      );

      PERFORM public.refresh_seller_daily_metrics(x.seller_id, NEW.created_at::date);
    END LOOP;

  ELSIF NEW.status = 'cancelled' THEN
    FOR x IN SELECT DISTINCT seller_id FROM public.order_items WHERE order_id = NEW.id LOOP
      PERFORM public.refresh_seller_daily_metrics(x.seller_id, NEW.created_at::date);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_finance_metrics ON public.orders;
CREATE TRIGGER trg_order_status_finance_metrics
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_order_status_finance_metrics();
