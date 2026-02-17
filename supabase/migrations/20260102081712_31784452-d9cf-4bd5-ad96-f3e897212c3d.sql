-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view music tracks" ON public.music_tracks;

-- Create a new policy that only shows:
-- 1. Default/system tracks (uploaded_by is NULL or is_default is true)
-- 2. Tracks uploaded by the current authenticated user
CREATE POLICY "Users can view accessible music tracks" 
ON public.music_tracks 
FOR SELECT 
USING (
  is_default = true 
  OR uploaded_by IS NULL 
  OR auth.uid() = uploaded_by
);