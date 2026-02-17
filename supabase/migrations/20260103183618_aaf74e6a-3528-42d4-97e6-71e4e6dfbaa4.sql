-- Fix playlist share code access control vulnerability
-- The previous policy allowed ANY authenticated user to see ALL playlists with share_code IS NOT NULL

-- Step 1: Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can view accessible playlists" ON public.playlists;

-- Step 2: Create secure policy without the share_code condition
CREATE POLICY "Users can view accessible playlists"
ON public.playlists FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR EXISTS (SELECT 1 FROM public.shared_playlists WHERE playlist_id = id AND shared_with = auth.uid())
);

-- Step 3: Add unique constraint to shared_playlists for ON CONFLICT to work
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shared_playlists_playlist_shared_with_unique'
  ) THEN
    ALTER TABLE public.shared_playlists 
    ADD CONSTRAINT shared_playlists_playlist_shared_with_unique 
    UNIQUE (playlist_id, shared_with);
  END IF;
END $$;

-- Step 4: Create RPC function to access playlist by share code
-- This function validates the share code and grants access via shared_playlists table
CREATE OR REPLACE FUNCTION public.access_playlist_by_share_code(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_playlist_id uuid;
  v_owner_id uuid;
  v_playlist_name text;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Validate share code input
  IF p_share_code IS NULL OR length(p_share_code) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid share code');
  END IF;

  -- Find playlist by share code
  SELECT id, user_id, name INTO v_playlist_id, v_owner_id, v_playlist_name
  FROM playlists 
  WHERE share_code = p_share_code;

  IF v_playlist_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired share code');
  END IF;

  -- Don't need to grant access if user already owns the playlist
  IF v_owner_id = auth.uid() THEN
    RETURN jsonb_build_object('success', true, 'playlist_id', v_playlist_id, 'name', v_playlist_name, 'already_owner', true);
  END IF;

  -- Grant access by adding to shared_playlists table
  INSERT INTO shared_playlists (playlist_id, shared_by, shared_with, can_edit)
  VALUES (v_playlist_id, v_owner_id, auth.uid(), false)
  ON CONFLICT (playlist_id, shared_with) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'playlist_id', v_playlist_id, 'name', v_playlist_name);
END;
$$;