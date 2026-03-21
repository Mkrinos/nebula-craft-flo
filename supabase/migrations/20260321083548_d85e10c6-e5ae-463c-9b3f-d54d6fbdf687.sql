DROP POLICY IF EXISTS "Users can view accessible music tracks" ON public.music_tracks;

CREATE POLICY "Anyone can view music tracks"
  ON public.music_tracks
  FOR SELECT
  USING (true);