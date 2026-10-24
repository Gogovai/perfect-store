-- Prevent self-service profile edits from escalating a customer to admin.
-- Auth/profile creation is handled by trusted auth triggers or server-side service-role code.
BEGIN;

REVOKE INSERT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Permit normal self-service profile edits, but never role, is_active, email, id,
-- or creation timestamp changes from a browser session.
GRANT UPDATE (first_name, last_name, phone, avatar_url, updated_at)
  ON TABLE public.profiles TO authenticated;

COMMIT;
