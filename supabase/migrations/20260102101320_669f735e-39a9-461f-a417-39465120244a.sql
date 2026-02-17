-- Security Hardening: Child Activity Logging & Playlist Sharing

-- ============================================
-- 1. CHILD_ACTIVITY_LOG - Remove direct INSERT, create secure RPC
-- ============================================
DROP POLICY IF EXISTS "System can insert activity logs" ON child_activity_log;

-- Create secure RPC function for logging child activity
CREATE OR REPLACE FUNCTION public.log_child_activity(
  p_child_user_id uuid,
  p_activity_type text,
  p_activity_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Only allow users to log their own activity
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_child_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Cannot log activity for other users');
  END IF;

  -- Validate activity type
  IF p_activity_type IS NULL OR p_activity_type = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Activity type is required');
  END IF;

  -- Insert the activity log
  INSERT INTO child_activity_log (child_user_id, activity_type, activity_details)
  VALUES (p_child_user_id, p_activity_type, p_activity_details);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 2. PLAYLISTS - Generate cryptographically secure share codes
-- ============================================

-- Create function to generate secure share codes (32+ characters)
CREATE OR REPLACE FUNCTION public.generate_secure_share_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
BEGIN
  -- Generate a cryptographically secure 32-character code
  SELECT encode(gen_random_bytes(24), 'base64') INTO v_code;
  -- Remove special characters that might cause URL issues
  v_code := replace(replace(replace(v_code, '+', 'x'), '/', 'y'), '=', '');
  RETURN v_code;
END;
$$;

-- Create secure RPC function for generating playlist share codes
CREATE OR REPLACE FUNCTION public.create_playlist_share_code(p_playlist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_code text;
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Verify ownership
  SELECT user_id INTO v_owner_id FROM playlists WHERE id = p_playlist_id;
  
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Playlist not found');
  END IF;
  
  IF v_owner_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Not playlist owner');
  END IF;

  -- Generate secure share code
  v_share_code := generate_secure_share_code();
  
  -- Update playlist with new share code
  UPDATE playlists
  SET share_code = v_share_code, updated_at = now()
  WHERE id = p_playlist_id;
  
  RETURN jsonb_build_object('success', true, 'share_code', v_share_code);
END;
$$;

-- Create function to revoke share code
CREATE OR REPLACE FUNCTION public.revoke_playlist_share_code(p_playlist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Verify ownership
  SELECT user_id INTO v_owner_id FROM playlists WHERE id = p_playlist_id;
  
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Playlist not found');
  END IF;
  
  IF v_owner_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Not playlist owner');
  END IF;

  -- Remove share code
  UPDATE playlists
  SET share_code = NULL, updated_at = now()
  WHERE id = p_playlist_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update existing share codes to be more secure (regenerate weak ones)
UPDATE playlists
SET share_code = encode(gen_random_bytes(24), 'base64')
WHERE share_code IS NOT NULL AND length(share_code) < 20;