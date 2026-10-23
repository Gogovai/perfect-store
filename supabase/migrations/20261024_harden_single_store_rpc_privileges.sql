-- Reduce the exposed RPC surface after switching to a single-owner store.
-- User-facing RPCs remain available to authenticated users and must retain their
-- own authorization checks. Trigger/maintenance/legacy marketplace functions are
-- not client APIs and should not be executable through PostgREST.
DO $$
DECLARE
  r record;
  v_authenticated_functions text[] := ARRAY[
    'admin_create_product',
    'admin_moderate_product',
    'admin_set_order_status',
    'cancel_order',
    'create_order',
    'create_order_with_coupon',
    'is_order_party',
    'request_order_return',
    'submit_product_review',
    'validate_coupon'
  ];
  v_private_functions text[] := ARRAY[
    'admin_set_seller_status',
    'calculate_commission',
    'create_ad_payment',
    'ensure_product_inventory',
    'expire_flash_sales',
    'handle_new_user_autoconfirm',
    'notify_product_status_change',
    'on_return_status_settlement',
    'on_shipment_status_event',
    'seed_seller_order_group',
    'seller_set_order_status',
    'submit_seller_application',
    'sync_order_status_from_seller_groups',
    'sync_seller_order_group_on_item'
  ];
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND p.proname = ANY (v_authenticated_functions || v_private_functions)
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.nspname, r.proname, r.args
    );

    IF r.proname = ANY (v_authenticated_functions) THEN
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',
        r.nspname, r.proname, r.args
      );
    END IF;
  END LOOP;
END
$$;
