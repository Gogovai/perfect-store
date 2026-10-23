# Security Policy

## Production security baseline

- Customer data and store operations must be protected by Supabase Row Level Security and server-side authorization; verify the actual policies before launch rather than assuming they are correct.
- Privileged database functions must use restricted execution privileges and a fixed `search_path` where appropriate.
- Supabase service-role credentials and Hubtel client secrets are server-only. Never expose them through `NEXT_PUBLIC_*` variables or commit them to Git.
- Hubtel is the only intended online payment provider. The server must independently verify each transaction using the official API flow enabled for the merchant account before marking an order paid.
- Payment callbacks must be treated as untrusted, validated against the expected reference, amount, currency and transaction status, and handled idempotently.
- Production secrets must be configured through Vercel/Supabase secret settings, not committed to source control.

## Before launch

1. Enable leaked-password protection and configure allowed redirect URLs in Supabase Auth.
2. Configure `SUPABASE_SERVICE_ROLE_KEY` and Hubtel credentials only in server-side environments.
3. Test authorization boundaries with separate customer and store-admin accounts; public registration must never grant admin privileges.
4. Verify Hubtel checkout, transaction lookup, callback payloads, amount/currency matching, retry behavior, duplicate notifications, failure and cancellation against the official documentation and merchant sandbox. Do not enable live payments until these pass.
5. Review Supabase RLS, storage policies, database functions, and security/performance advisors after schema changes.
6. Test order privacy, stock reservation/concurrency, delivery-rate matching, refunds/cancellations, and the complete mobile checkout flow before launch.
7. Never apply migrations to production until they have been reviewed and tested against a non-production copy of the schema/data.

## Reporting

Report suspected vulnerabilities privately to the repository owner. Do not include credentials, customer data, or other secrets in public issues.
