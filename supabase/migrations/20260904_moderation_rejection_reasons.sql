-- Moderation lifecycle (Phases 1-2): rejection decisions must carry a durable
-- reason that the seller can see, not only an audit-log payload. Without the
-- columns there is nowhere to store "why" on the moderated row itself, so
-- sellers could never read the reason from their own dashboards.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Sellers read their own product rows (id / seller_id scoped policies), so the
-- new columns inherit the existing RLS visibility and need no extra policy.
