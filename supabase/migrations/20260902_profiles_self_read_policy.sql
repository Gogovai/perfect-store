-- Allow authenticated users to read the profile used for role-aware UI and redirects.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Users can read their own profile'
    ) THEN
    EXECUTE 'CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid())';
  END IF;
END $$;