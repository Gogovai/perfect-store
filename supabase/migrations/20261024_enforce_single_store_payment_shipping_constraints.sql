-- Tighten single-store constraints so NULL values cannot bypass CHECK semantics.
-- Existing production rows were queried and all pass the stricter rules.
BEGIN;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_method_single_store_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_method_single_store_check
  CHECK (delivery_method IS NOT NULL AND delivery_method IN ('standard', 'express')) NOT VALID;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_shipping_country_ghana_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_country_ghana_check
  CHECK (
    shipping_address ->> 'country' IS NOT NULL
    AND lower(btrim(shipping_address ->> 'country')) IN ('ghana', 'gh')
  ) NOT VALID;

ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_quantity_limit_check;

ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_quantity_limit_check
  CHECK (quantity IS NOT NULL AND quantity BETWEEN 1 AND 99) NOT VALID;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_provider_single_store_check
  CHECK (provider IS NOT NULL AND provider IN ('hubtel', 'cash_on_delivery')) NOT VALID;

ALTER TABLE public.orders
  VALIDATE CONSTRAINT orders_delivery_method_single_store_check;

ALTER TABLE public.orders
  VALIDATE CONSTRAINT orders_shipping_country_ghana_check;

ALTER TABLE public.cart_items
  VALIDATE CONSTRAINT cart_items_quantity_limit_check;

ALTER TABLE public.payments
  VALIDATE CONSTRAINT payments_provider_single_store_check;

COMMIT;
