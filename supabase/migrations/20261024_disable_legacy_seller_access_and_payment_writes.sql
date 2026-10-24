-- Disable legacy seller access paths and prevent customers from writing payment status.
-- Keep marketplace history intact, but no longer expose seller identities or seller-owned records.
BEGIN;

-- Customers may read their own payment records, but only trusted server-side
-- code and security-definer order functions may create or change payment state.
DROP POLICY IF EXISTS payments_customer_insert ON public.payments;
DROP POLICY IF EXISTS payments_customer_update ON public.payments;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.payments FROM PUBLIC, anon, authenticated;

-- Order visibility is customer/admin only. Seller-owned legacy order items must
-- not grant access to customer orders, shipping addresses, or payment records.
CREATE OR REPLACE FUNCTION public.is_order_party(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = p_order_id
      AND o.customer_id = auth.uid()
  )
  OR private.is_admin()
$$;
REVOKE ALL ON FUNCTION public.is_order_party(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_party(uuid) TO authenticated;

-- Remove seller-only reads of customer orders, returns, support and shipment data.
DROP POLICY IF EXISTS returns_seller ON public.returns;
DROP POLICY IF EXISTS return_items_seller ON public.return_items;
DROP POLICY IF EXISTS support_seller ON public.support_tickets;
DROP POLICY IF EXISTS support_messages_seller ON public.support_messages;
DROP POLICY IF EXISTS shipment_events_seller ON public.shipment_events;
DROP POLICY IF EXISTS seller_order_groups_seller ON public.seller_order_groups;

-- Remove seller-facing access to legacy marketplace, ad, inventory, and finance tables.
DROP POLICY IF EXISTS ad_payments_seller ON public.ad_payments;
DROP POLICY IF EXISTS ads_seller ON public.advertisements;
DROP POLICY IF EXISTS flash_sales_seller ON public.flash_sales;
DROP POLICY IF EXISTS marketplace_txn_seller ON public.marketplace_transactions;
DROP POLICY IF EXISTS seller_bank_owner ON public.seller_bank_accounts;
DROP POLICY IF EXISTS seller_business_owner ON public.seller_business_profiles;
DROP POLICY IF EXISTS seller_docs_owner ON public.seller_documents;
DROP POLICY IF EXISTS ledger_seller ON public.seller_ledger_entries;
DROP POLICY IF EXISTS metrics_seller ON public.seller_metrics_daily;
DROP POLICY IF EXISTS warehouse_inventory_seller ON public.warehouse_inventory;
DROP POLICY IF EXISTS warehouses_seller ON public.warehouses;

-- The payout policy previously allowed sellers and admins. Preserve admin-only
-- access to the historical payout ledger.
DROP POLICY IF EXISTS seller_payouts_seller_select ON public.seller_payouts;
CREATE POLICY seller_payouts_admin_select
  ON public.seller_payouts
  FOR SELECT TO authenticated
  USING (private.is_admin());

-- No new seller profiles or public seller-directory reads. Preserve the rows for
-- historical order/finance references and keep them available to administrators.
DROP POLICY IF EXISTS sellers_owner_insert ON public.sellers;
DROP POLICY IF EXISTS sellers_owner_update ON public.sellers;
DROP POLICY IF EXISTS sellers_public_select ON public.sellers;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.sellers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sellers TO authenticated;
CREATE POLICY sellers_admin_manage
  ON public.sellers
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

COMMIT;
