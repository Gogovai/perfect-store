-- Fix: Allow anonymous/authenticated storefront reads on inventory tables
-- Problem: inventory and variant_inventory only had seller-manage policies (ALL cmd),
--          which require is_seller_owner() or is_admin(). Anonymous storefront queries
--          that JOIN these tables get empty results, causing all products to show
--          "Out of Stock".

-- 1. Public SELECT on inventory (stock levels visible to storefront)
CREATE POLICY inventory_public_select
  ON inventory
  FOR SELECT
  TO public
  USING (true);

-- 2. Public SELECT on variant_inventory (variant stock levels visible to storefront)
CREATE POLICY variant_inventory_public_select
  ON variant_inventory
  FOR SELECT
  TO public
  USING (true);

-- 3. seller_order_groups: NOT needed for product queries.
--    Current policies (admin, customer, seller) are appropriate for order management.
--    No changes required.
