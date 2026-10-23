-- Seller order-group trigger retained for historical seller-attributed items only.
-- Single-store order items have seller_id NULL and must not create seller groups.
DO $do$
BEGIN
  IF to_regclass('public.seller_order_groups') IS NULL THEN
    RAISE NOTICE 'seller_order_groups not present; skipping seller-group sync update';
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.sync_seller_order_group_on_item()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $func$
  DECLARE v_gid uuid;
  BEGIN
    IF new.seller_id IS NULL OR to_regclass('public.seller_order_groups') IS NULL THEN
      RETURN new;
    END IF;

    SELECT id INTO v_gid FROM public.seller_order_groups
     WHERE order_id = new.order_id AND seller_id = new.seller_id FOR UPDATE;

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
  CREATE TRIGGER trg_seller_order_groups_sync AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.sync_seller_order_group_on_item();
END $do$;
