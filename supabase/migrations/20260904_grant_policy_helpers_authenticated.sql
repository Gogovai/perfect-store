-- Logged-in customers got an EMPTY storefront: queries that embed tables
-- whose RLS policies call private.is_admin()/is_seller_owner() (inventory,
-- product_images, seller profiles, ...) failed with
-- "permission denied for function is_seller_owner" for the authenticated
-- role, while anonymous requests worked (a prior migration granted EXECUTE
-- to anon only).
--
-- Both helpers only perform role/ownership checks and never grant a caller
-- data they could not already reach through the calling policy, so EXECUTE
-- for authenticated (and anon, for databases that never ran the earlier
-- anon-only grant) only lets policy evaluation complete.
--
-- Grants are issued dynamically from pg_proc so they apply regardless of the
-- helper's exact signature (the functions are managed outside this
-- repository) or schema (public or private).

DO $do$
DECLARE
  r record;
  v_role text;
BEGIN
  FOR v_role IN SELECT unnest(ARRAY['anon', 'authenticated']) AS role_name
  LOOP
    FOR r IN
      SELECT n.nspname, p.proname,
             pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname IN ('is_admin', 'is_seller_owner')
        AND n.nspname IN ('public', 'private')
    LOOP
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', r.nspname, v_role);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO %I', r.nspname, r.proname, r.args, v_role);
    END LOOP;
  END LOOP;
END $do$;
