-- Allow customers to create support tickets and send messages on their own
-- tickets. Previously only private.is_admin() could INSERT (admin "ALL"
-- policy) while customers had read-only policies, so every customer-side
-- "create ticket"/"reply" failed with "new row violates row-level security".

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets'
      AND policyname = 'support_tickets_customer_insert'
  ) THEN
    EXECUTE 'CREATE POLICY support_tickets_customer_insert ON public.support_tickets
             FOR INSERT TO authenticated
             WITH CHECK (customer_id = (SELECT auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_messages'
      AND policyname = 'support_messages_customer_insert'
  ) THEN
    EXECUTE 'CREATE POLICY support_messages_customer_insert ON public.support_messages
             FOR INSERT TO authenticated
             WITH CHECK (
               sender_id = (SELECT auth.uid())
               AND EXISTS (
                 SELECT 1 FROM public.support_tickets t
                 WHERE t.id = support_messages.ticket_id
                   AND t.customer_id = (SELECT auth.uid())
               )
             )';
  END IF;
END $$;
