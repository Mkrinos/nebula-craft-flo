-- Fix 1: Update handle_new_user() to create initial credit record for new users
-- This ensures users have credits from signup, not on first API call

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  
  -- Create initial credit record for new user (proactive initialization)
  INSERT INTO public.user_credits (user_id, credits_spent, credits_earned, subscription_tier, monthly_credit_limit)
  VALUES (new.id, 0, 0, 'starter_universe', 100);
  
  RETURN new;
END;
$function$;

-- Fix 2: Update can_view_profile() to be more privacy-conscious
-- Remove automatic visibility based on public images and active studios
-- Only allow: self-view, follows, friendships (mutual social connections)

CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    -- User can always view their own profile
    target_user_id = auth.uid()
    OR
    -- User follows this person (explicit social connection)
    EXISTS (
      SELECT 1 FROM user_follows 
      WHERE follower_id = auth.uid() AND following_id = target_user_id
    )
    OR
    -- User is friends with this person (accepted status - mutual connection)
    EXISTS (
      SELECT 1 FROM user_friends 
      WHERE status = 'accepted' 
      AND ((user_id = auth.uid() AND friend_id = target_user_id)
        OR (friend_id = auth.uid() AND user_id = target_user_id))
    )
$function$;