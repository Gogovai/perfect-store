-- Enforce checkout invariants at the database boundary, including direct RPC calls.
-- Existing rows were audited before adding and validating these constraints.
BEGIN;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_method_single_store_check
  CHECK (delivery_method IN ('standard', 'express')) NOT VALID;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_country_ghana_check
  CHECK (
    shipping_address ->> 'country' IS NULL
    OR lower(btrim(shipping_address ->> 'country')) IN ('ghana', 'gh')
  ) NOT VALID;

ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_quantity_limit_check
  CHECK (quantity BETWEEN 1 AND 99) NOT VALID;

ALTER TABLE public.orders
  VALIDATE CONSTRAINT orders_delivery_method_single_store_check;

ALTER TABLE public.orders
  VALIDATE CONSTRAINT orders_shipping_country_ghana_check;

ALTER TABLE public.cart_items
  VALIDATE CONSTRAINT cart_items_quantity_limit_check;

COMMIT;
