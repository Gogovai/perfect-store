# Security Policy

## Production security baseline

- Supabase Row Level Security is enabled on application tables.
- Privileged database functions use restricted execution privileges and a fixed `search_path` where required.
- Supabase service-role credentials are server-only and must never be exposed to browser code.
- Paystack transaction results are verified server-side before payment/order state is updated.
- Production secrets must be configured through Vercel/Supabase secret configuration, not committed to Git.

## Before launch

1. Enable leaked-password protection in Supabase Auth.
2. Configure a real `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` only in server-side environments.
3. Test authorization boundaries with separate customer, seller and admin accounts.
4. Verify payment callbacks and order state transitions with Paystack test transactions before enabling live payments.
5. Review Supabase security and performance advisors after schema changes.
