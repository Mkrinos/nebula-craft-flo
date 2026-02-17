-- Create table for user unlocked themes
CREATE TABLE public.user_unlocked_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  theme_id TEXT NOT NULL,
  unlock_method TEXT NOT NULL DEFAULT 'credits', -- 'credits', 'tier', 'achievement'
  credits_spent INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, theme_id)
);

-- Enable RLS
ALTER TABLE public.user_unlocked_themes ENABLE ROW LEVEL SECURITY;

-- Users can view their unlocked themes
CREATE POLICY "Users can view their unlocked themes"
ON public.user_unlocked_themes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their unlocked themes (via credit purchase)
CREATE POLICY "Users can unlock themes"
ON public.user_unlocked_themes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to unlock theme with credits
CREATE OR REPLACE FUNCTION public.unlock_theme_with_credits(
  p_user_id UUID,
  p_theme_id TEXT,
  p_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_used INTEGER;
  v_limit INTEGER;
  v_remaining INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
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
$$;