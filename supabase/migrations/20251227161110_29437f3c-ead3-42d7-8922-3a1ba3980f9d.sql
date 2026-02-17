-- Add subscription tier and monthly limits to user_credits
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'starter_universe',
ADD COLUMN IF NOT EXISTS monthly_credit_limit INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS has_voice_access BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS has_hd_quality BOOLEAN NOT NULL DEFAULT false;

-- Create subscription_plans reference table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL,
  monthly_credits INTEGER, -- NULL means unlimited
  has_voice_access BOOLEAN NOT NULL DEFAULT false,
  has_hd_quality BOOLEAN NOT NULL DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view plans
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
USING (true);

-- Insert the subscription tiers
INSERT INTO public.subscription_plans (id, name, price_monthly, monthly_credits, has_voice_access, has_hd_quality, features, sort_order)
VALUES 
  ('starter_universe', 'Starter Universe', 9, 100, false, false, '["100 interaction credits", "Basic space themes", "Standard controls", "Community access"]'::jsonb, 1),
  ('stellar', 'Stellar', 19, 500, false, false, '["500 interaction credits", "Basic sci-fi themes", "Standard gesture controls", "Community features"]'::jsonb, 2),
  ('cosmic', 'Cosmic', 39, NULL, true, true, '["Unlimited interactions", "Advanced 3D environments", "Custom avatar creation", "Premium gesture sets", "Export capabilities", "Voice narration"]'::jsonb, 3),
  ('galactic', 'Galactic', 79, NULL, true, true, '["Everything in Cosmic", "Collaborative spaces", "Custom world building", "Advanced AI interactions", "Priority feature access", "Premium voice narration"]'::jsonb, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  monthly_credits = EXCLUDED.monthly_credits,
  has_voice_access = EXCLUDED.has_voice_access,
  has_hd_quality = EXCLUDED.has_hd_quality,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order;

-- Create function to check if user can use credits
CREATE OR REPLACE FUNCTION public.check_and_deduct_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_used INTEGER;
  v_limit INTEGER;
  v_tier TEXT;
  v_remaining INTEGER;
BEGIN
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
$$;

-- Create function to get user subscription info
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
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
$$;