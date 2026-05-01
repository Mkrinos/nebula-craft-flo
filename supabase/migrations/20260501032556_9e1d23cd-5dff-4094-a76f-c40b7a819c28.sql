-- 1. Update check_and_deduct_credit to auto-reset monthly credits
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
  v_reset_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Unauthorized: Cannot modify other users credits');
  END IF;

  SELECT uc.credits_spent, uc.monthly_credit_limit, uc.subscription_tier, uc.credits_reset_at
  INTO v_credits_used, v_limit, v_tier, v_reset_at
  FROM user_credits uc
  WHERE uc.user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits_spent, credits_earned, subscription_tier, monthly_credit_limit, credits_reset_at)
    VALUES (p_user_id, 0, 0, 'starter_universe', 100, now())
    RETURNING credits_spent, monthly_credit_limit, subscription_tier, credits_reset_at
    INTO v_credits_used, v_limit, v_tier, v_reset_at;
  END IF;

  -- Auto-reset if 30 days have passed
  IF v_reset_at IS NOT NULL AND v_reset_at < (now() - INTERVAL '30 days') THEN
    UPDATE user_credits
    SET credits_spent = 0, credits_reset_at = now(), updated_at = now()
    WHERE user_id = p_user_id;
    v_credits_used := 0;
  END IF;
  
  IF v_limit IS NULL THEN
    UPDATE user_credits 
    SET credits_spent = credits_spent + p_amount, updated_at = now()
    WHERE user_id = p_user_id;
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'tier', v_tier);
  END IF;
  
  v_remaining := v_limit - v_credits_used;
  
  IF v_remaining < p_amount THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', v_remaining, 'tier', v_tier, 'error', 'Not enough credits');
  END IF;
  
  UPDATE user_credits 
  SET credits_spent = credits_spent + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object('allowed', true, 'remaining', v_remaining - p_amount, 'tier', v_tier);
END;
$function$;

-- 2. Update get_user_subscription to also auto-reset
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_reset_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Cannot view other users subscription');
  END IF;

  -- Auto-reset if 30 days have passed
  SELECT credits_reset_at INTO v_reset_at FROM user_credits WHERE user_id = p_user_id;
  IF v_reset_at IS NOT NULL AND v_reset_at < (now() - INTERVAL '30 days') THEN
    UPDATE user_credits
    SET credits_spent = 0, credits_reset_at = now(), updated_at = now()
    WHERE user_id = p_user_id;
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

-- 3. Tighten feedback RLS: require authenticated user_id (no null)
DROP POLICY IF EXISTS "Only authenticated users can submit feedback" ON public.feedback_submissions;
CREATE POLICY "Only authenticated users can submit feedback"
ON public.feedback_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Rate-limit feedback: max 5 submissions per user per day
CREATE OR REPLACE FUNCTION public.enforce_feedback_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Anonymous feedback is not allowed';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM feedback_submissions
  WHERE user_id = NEW.user_id
    AND created_at > (now() - INTERVAL '24 hours');

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Daily feedback limit reached (5 per day). Please try again tomorrow.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_rate_limit_trigger ON public.feedback_submissions;
CREATE TRIGGER feedback_rate_limit_trigger
BEFORE INSERT ON public.feedback_submissions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_feedback_rate_limit();