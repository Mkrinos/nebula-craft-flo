
-- 1. Storage: scope uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Users can upload images to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 2. Parental controls: remove direct child UPDATE bypass
DROP POLICY IF EXISTS "Children can respond to parent requests" ON public.parental_controls;

-- 3. Studio comments: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view comments" ON public.studio_comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.studio_comments FOR SELECT
  TO authenticated
  USING (true);

-- 4. Playlist tracks: align SELECT with playlists policy (include shared_playlists)
DROP POLICY IF EXISTS "Users can view tracks in accessible playlists" ON public.playlist_tracks;
CREATE POLICY "Users can view tracks in accessible playlists"
  ON public.playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_tracks.playlist_id
        AND (
          p.user_id = auth.uid()
          OR p.is_public = true
          OR EXISTS (
            SELECT 1 FROM public.shared_playlists sp
            WHERE sp.playlist_id = p.id AND sp.shared_with = auth.uid()
          )
        )
    )
  );
