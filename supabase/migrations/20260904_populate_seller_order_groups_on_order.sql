-- Seller fulfilment depends on per-seller order groups (seller_order_groups),
-- which back the seller order console and seller_set_order_status. Nothing in
-- the codebase or database ever populated that table, so every order placed
-- through create_order produced ZERO group rows: sellers saw "No customer
-- orders yet" and seller_set_order_status raised 'Order not found', making the
-- whole per-seller fulfilment design unreachable.
--
-- This migration closes the gap with an AFTER INSERT trigger on order_items
-- that upserts one group row per fulfilling seller at order time (subtotal
-- accumulates across the seller's items). A guarded one-time backfill covers
-- any orders that predate this migration.
--
-- Guarded: on a database without the (dashboard-managed) seller_order_groups
-- table the whole block no-ops, so fresh projects cannot break.

DO $do$
BEGIN
  IF to_regclass('public.seller_order_groups') IS NULL THEN
    RAISE NOTICE 'seller_order_groups not present; skipping seller-group sync migration';
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.sync_seller_order_group_on_item()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $func$
  DECLARE
    v_gid uuid;
  BEGIN
    -- Belt and braces for databases without the table (trigger would only
    -- ever fire there via a direct order_items insert).
    IF to_regclass('public.seller_order_groups') IS NULL THEN
      RETURN new;
    END IF;

    SELECT id INTO v_gid
      FROM public.seller_order_groups
     WHERE order_id = new.order_id AND seller_id = new.seller_id
     FOR UPDATE;

    IF v_gid IS NULL THEN
      INSERT INTO public.seller_order_groups (order_id, seller_id, status, subtotal)
      VALUES (new.order_id, new.seller_id, 'pending', new.total_price);
    ELSE
      UPDATE public.seller_order_groups
         SET subtotal = subtotal + new.total_price, updated_at = now()
       WHERE id = v_gid;
    END IF;

    RETURN new;
  END $func$;

  DROP TRIGGER IF EXISTS trg_seller_order_groups_sync ON public.order_items;
  CREATE TRIGGER trg_seller_order_groups_sync
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_seller_order_group_on_item();

  -- Backfill orders that predate this migration (idempotent: existing group
  -- rows — statuses advanced by sellers — are never touched).
  INSERT INTO public.seller_order_groups (order_id, seller_id, status, subtotal)
  SELECT oi.order_id, oi.seller_id, 'pending', sum(oi.total_price)
    FROM public.order_items oi
   GROUP BY oi.order_id, oi.seller_id
  ON CONFLICT (order_id, seller_id) DO NOTHING;
END $do$;
