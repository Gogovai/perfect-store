-- Allow server-side service-role operations to resolve the private auth helpers.
-- The private schema and is_admin function are managed outside this repository.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA private TO service_role, authenticated';
  END IF;

  IF to_regprocedure('private.is_admin()') IS NOT NULL THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION private.is_admin() TO service_role, authenticated';
  END IF;
END $$;