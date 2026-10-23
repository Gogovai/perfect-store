-- Cover foreign-key columns identified by the Supabase performance advisor.
-- Keep historical marketplace tables intact; these indexes only improve lookups
-- and parent-row update/delete checks.
CREATE INDEX IF NOT EXISTS idx_flash_sales_payment_id
  ON public.flash_sales (payment_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_order_item_id
  ON public.marketplace_transactions (order_item_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_product_id
  ON public.marketplace_transactions (product_id);

CREATE INDEX IF NOT EXISTS idx_products_created_by
  ON public.products (created_by);

CREATE INDEX IF NOT EXISTS idx_sellers_owner_id
  ON public.sellers (owner_id);
