-- Allow anonymous storefront requests to evaluate RLS policies that call the
-- private.is_admin() and is_seller_owner() helper functions.
--
-- Both helpers only perform role/ownership checks and always return false for
-- anonymous callers, so granting EXECUTE to anon does not expose any admin or
-- seller capability — it lets policy evaluation complete so public rows
-- (active products, sellers, categories, images, variants, inventory,
-- published reviews) become readable. Previously the anon role lacked
-- EXECUTE on these helpers, so public table reads failed with
-- "permission denied for function is_admin/is_seller_owner", hiding even
-- products that had been approved/published by an admin.
--
-- Grants are issued dynamically from pg_proc so they apply regardless of the
-- helper's exact signature (the functions are managed outside this
-- repository).

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN ('is_admin', 'is_seller_owner')
      AND n.nspname IN ('public', 'private')
  LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon', r.nspname);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon', r.nspname, r.proname, r.args);
  END LOOP;
END $$;
