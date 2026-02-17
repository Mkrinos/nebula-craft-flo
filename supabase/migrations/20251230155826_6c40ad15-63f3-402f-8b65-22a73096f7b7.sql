-- Add UPDATE policy for playlist_tracks to allow reordering
CREATE POLICY "Users can update tracks in their playlists" ON public.playlist_tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );