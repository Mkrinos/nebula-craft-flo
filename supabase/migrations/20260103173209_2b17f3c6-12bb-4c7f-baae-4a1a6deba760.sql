-- Create a helper function to check if user can view a profile
-- This avoids RLS recursion by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User can always view their own profile
    target_user_id = auth.uid()
    OR
    -- User follows this person
    EXISTS (
      SELECT 1 FROM user_follows 
      WHERE follower_id = auth.uid() AND following_id = target_user_id
    )
    OR
    -- User is friends with this person (accepted status)
    EXISTS (
      SELECT 1 FROM user_friends 
      WHERE status = 'accepted' 
      AND ((user_id = auth.uid() AND friend_id = target_user_id)
        OR (friend_id = auth.uid() AND user_id = target_user_id))
    )
    OR
    -- This person has public images (community gallery creator)
    EXISTS (
      SELECT 1 FROM generated_images 
      WHERE user_id = target_user_id AND is_public = true
    )
    OR
    -- This person owns a studio that's been visited/liked
    EXISTS (
      SELECT 1 FROM user_studios us
      WHERE us.user_id = target_user_id AND us.is_active = true
    )
$$;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policy allowing social profile viewing
CREATE POLICY "Users can view accessible profiles"
ON public.profiles
FOR SELECT
USING (public.can_view_profile(id));