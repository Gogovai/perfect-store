-- Remove unused marketplace-era RPCs after the storefront and checkout were
-- converted to a single-owner clothing store. These functions have no callers
-- in the current application and should not remain exposed through PostgREST.
DO $$
DECLARE
  r record;
  v_unused_functions text[] := ARRAY[
    'admin_create_product',
    'admin_moderate_product',
    'create_order_with_coupon',
    'get_product_available_quantity',
    'validate_coupon'
  ];
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prokind = 'f'
       AND p.proname = ANY (v_unused_functions)
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.nspname, r.proname, r.args
    );
  END LOOP;
END
$$;
