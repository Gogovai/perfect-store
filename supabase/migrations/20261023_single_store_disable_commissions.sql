-- Single-owner store: disable marketplace commission calculations while retaining
-- historical finance tables and rows for auditability.
BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_commission(
  p_seller_id uuid,
  p_amount numeric,
  p_category_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 0::numeric;
$$;

REVOKE ALL ON FUNCTION public.calculate_commission(uuid, numeric, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_commission(uuid, numeric, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.calculate_commission(uuid, numeric, uuid) FROM authenticated;

COMMIT;
