-- Disable seller onboarding for the single-owner store without deleting legacy records.
-- Keep the function signature so old clients fail safely with a clear message.
BEGIN;

CREATE OR REPLACE FUNCTION public.submit_seller_application(
  p_store_name text,
  p_description text,
  p_phone text,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Seller applications are disabled. This store is managed by one owner.';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_seller_application(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_seller_application(text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.submit_seller_application(text, text, text, text) FROM authenticated;

COMMIT;
