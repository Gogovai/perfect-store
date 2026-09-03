-- Auto-confirm new user emails at signup so account creation is immediately usable.
-- Registration still requires a valid email + strong password; this only skips the
-- email-verification step (the "Confirm email" gate), not account creation itself.
--
-- Two parts, both applied to the live project:
--  1) Auth config (Management API): MAILER_AUTOCONFIRM=true so GoTrue auto-confirms
--     new signups and does NOT send confirmation emails (which previously also hit
--     the 2-email/hour rate limit and blocked signups with 429s).
--  2) This SQL: a DB-level trigger guaranteeing auto-confirmation even if the
--     dashboard toggle is ever re-enabled, plus confirming existing unconfirmed users.

-- 1) Trigger: confirm every newly created auth user right away
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- confirmed_at is a generated column (LEAST(email_confirmed_at, phone_confirmed_at)),
  -- so only email_confirmed_at needs to be set.
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_autoconfirm_new_user ON auth.users;
CREATE TRIGGER trg_autoconfirm_new_user
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_autoconfirm();

-- 2) Confirm users who signed up before this change (so they can log in now)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;