-- Fix child can read parental verification_code: drop child SELECT policy entirely.
-- Children do not need to query parental_controls; respond_to_parental_request
-- (SECURITY DEFINER) accepts the code shared out-of-band by the parent.
DROP POLICY IF EXISTS "Children can view pending requests for approval" ON public.parental_controls;

-- Fix self-referential bug in playlists SELECT policy so shared access works correctly.
DROP POLICY IF EXISTS "Users can view accessible playlists" ON public.playlists;
CREATE POLICY "Users can view accessible playlists"
  ON public.playlists
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.shared_playlists sp
      WHERE sp.playlist_id = playlists.id
        AND sp.shared_with = auth.uid()
    )
  );

-- Restrict user_follows SELECT so users can only see their own relationships,
-- preventing leakage of the global social graph.
DROP POLICY IF EXISTS "Authenticated users can view follows" ON public.user_follows;
CREATE POLICY "Users can view their own follow relationships"
  ON public.user_follows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Harden feedback_submissions: forbid anonymous (null user_id) rows at the
-- column level. The rate-limit trigger already rejects them, but this prevents
-- the row from ever being inserted and removes the contact_email-on-orphan risk.
ALTER TABLE public.feedback_submissions
  ALTER COLUMN user_id SET NOT NULL;