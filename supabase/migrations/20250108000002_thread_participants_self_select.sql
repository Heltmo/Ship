-- Allow users to read their own thread_participants rows (Inbox needs this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'thread_participants'
      AND policyname = 'Users can view their own thread participant rows'
  ) THEN
    CREATE POLICY "Users can view their own thread participant rows"
      ON public.thread_participants
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
