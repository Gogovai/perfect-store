-- Fix "infinite recursion detected in policy" on orders/order_items/payments/shipments.
--
-- The previous policy set on these tables referenced each other in cycles
-- (e.g. an orders policy querying shipments whose policy queried orders back),
-- so every SELECT — for anon AND authenticated — failed with
-- "infinite recursion detected in policy for relation ...". This broke order
-- history/detail/tracking, Paystack payment initialization, returns, reviews
-- and the seller/admin order consoles in production.
--
-- The fix:
--   1) A SECURITY DEFINER helper performs the ownership checks. Because the
--      helper runs as the table owner, RLS is not applied inside it, which
--      breaks the policy evaluation cycle.
--   2) All existing policies on the four tables are dropped by name from
--      pg_policies (works regardless of what they were called).
--   3) A minimal, correct policy set is recreated on top.
--
-- Order writes are untouched: create_order/cancel_order/admin_set_order_status/
-- seller_set_order_status are SECURITY DEFINER and bypass RLS entirely.

-- 1) Recursion-free ownership helper (customer of the order OR seller who
--    fulfils any of its items OR admin).
CREATE OR REPLACE FUNCTION public.is_order_party(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = p_order_id AND s.owner_id = auth.uid()
  )
  OR private.is_admin()
$$;

GRANT EXECUTE ON FUNCTION public.is_order_party(uuid) TO anon, authenticated;

-- 2) Drop the old (cyclic) policies on the four affected tables.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders', 'order_items', 'payments', 'shipments')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 3) Recreate a minimal, non-recursive policy set.

-- orders: the customer, fulfilling sellers, and admins may read.
CREATE POLICY orders_select_party ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_order_party(id));

-- order_items: same parties.
CREATE POLICY order_items_select_party ON public.order_items
  FOR SELECT TO authenticated
  USING (public.is_order_party(order_id));

-- payments: same parties may read.
CREATE POLICY payments_select_party ON public.payments
  FOR SELECT TO authenticated
  USING (public.is_order_party(order_id));

-- payments: the order's customer may create (setPaymentMethod upsert) and
-- update (Paystack initialize marks the row 'processing') their payment.
CREATE POLICY payments_customer_insert ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY payments_customer_update ON public.payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.customer_id = auth.uid()
    )
  );

-- shipments: parties may read; admins may do everything (logistics console).
CREATE POLICY shipments_select_party ON public.shipments
  FOR SELECT TO authenticated
  USING (public.is_order_party(order_id));

CREATE POLICY shipments_admin_all ON public.shipments
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());