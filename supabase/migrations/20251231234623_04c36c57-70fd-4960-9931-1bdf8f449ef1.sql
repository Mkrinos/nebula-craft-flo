-- Fix 1: Add auth.uid() validation to RPC functions to prevent cross-user operations

-- Update check_and_deduct_credit to validate caller
CREATE OR REPLACE FUNCTION public.check_and_deduct_credit(p_user_id uuid, p_amount integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits_used INTEGER;
  v_limit INTEGER;
  v_tier TEXT;
  v_remaining INTEGER;
BEGIN
  -- SECURITY: Validate that the caller is operating on their own data
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Unauthorized: Cannot modify other users credits');
  END IF;

  -- Get user's current credits and tier
  SELECT 
    uc.credits_spent,
    uc.monthly_credit_limit,
    uc.subscription_tier
  INTO v_credits_used, v_limit, v_tier
  FROM user_credits uc
  WHERE uc.user_id = p_user_id;
  
  -- If no record exists, create one with starter tier
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits_spent, credits_earned, subscription_tier, monthly_credit_limit)
    VALUES (p_user_id, 0, 0, 'starter_universe', 100)
    RETURNING credits_spent, monthly_credit_limit, subscription_tier
    INTO v_credits_used, v_limit, v_tier;
  END IF;
  
  -- NULL limit means unlimited
  IF v_limit IS NULL THEN
    -- Deduct credit (for tracking purposes)
    UPDATE user_credits 
    SET credits_spent = credits_spent + p_amount, updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'tier', v_tier);
  END IF;
  
  v_remaining := v_limit - v_credits_used;
  
  -- Check if user has enough credits
  IF v_remaining < p_amount THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', v_remaining, 'tier', v_tier, 'error', 'Not enough credits');
  END IF;
  
  -- Deduct credit
  UPDATE user_credits 
  SET credits_spent = credits_spent + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object('allowed', true, 'remaining', v_remaining - p_amount, 'tier', v_tier);
END;
$function$;

-- Update get_user_subscription to validate caller
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- SECURITY: Validate that the caller is querying their own data
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Cannot view other users subscription');
  END IF;

  SELECT jsonb_build_object(
    'tier', COALESCE(uc.subscription_tier, 'starter_universe'),
    'credits_used', COALESCE(uc.credits_spent, 0),
    'credits_limit', COALESCE(uc.monthly_credit_limit, 100),
    'credits_remaining', CASE 
      WHEN uc.monthly_credit_limit IS NULL THEN -1 
      ELSE GREATEST(0, uc.monthly_credit_limit - uc.credits_spent)
    END,
    'has_voice_access', COALESCE(uc.has_voice_access, false),
    'has_hd_quality', COALESCE(uc.has_hd_quality, false),
    'reset_at', uc.credits_reset_at
  )
  INTO v_result
  FROM user_credits uc
  WHERE uc.user_id = p_user_id;
  
  -- Return default if no record
  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'tier', 'starter_universe',
      'credits_used', 0,
      'credits_limit', 100,
      'credits_remaining', 100,
      'has_voice_access', false,
      'has_hd_quality', false,
      'reset_at', now()
    );
  END IF;
  
  RETURN v_result;
END;
$function$;

-- Update unlock_theme_with_credits to validate caller
CREATE OR REPLACE FUNCTION public.unlock_theme_with_credits(p_user_id uuid, p_theme_id text, p_cost integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits_used INTEGER;
  v_limit INTEGER;
  v_remaining INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- SECURITY: Validate that the caller is operating on their own data
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Cannot modify other users themes');
  END IF;

  -- Check if already unlocked
  SELECT EXISTS (
    SELECT 1 FROM user_unlocked_themes
    WHERE user_id = p_user_id AND theme_id = p_theme_id
  ) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Theme already unlocked');
  END IF;

  -- Get user's current credits
  SELECT credits_spent, monthly_credit_limit
  INTO v_credits_used, v_limit
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User credits not found');
  END IF;
  
  -- NULL limit means unlimited
  IF v_limit IS NOT NULL THEN
    v_remaining := v_limit - v_credits_used;
    
    IF v_remaining < p_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not enough credits', 'remaining', v_remaining);
    END IF;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET credits_spent = credits_spent + p_cost, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record the unlock
  INSERT INTO user_unlocked_themes (user_id, theme_id, unlock_method, credits_spent)
  VALUES (p_user_id, p_theme_id, 'credits', p_cost);
  
  RETURN jsonb_build_object('success', true, 'theme_id', p_theme_id);
END;
$function$;

-- Fix 2: Restrict profiles table to only allow users to view their own profile
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);