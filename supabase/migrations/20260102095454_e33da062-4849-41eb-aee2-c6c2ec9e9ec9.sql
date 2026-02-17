-- Security Hardening: Remove Direct User Modification Policies
-- All modifications to these tables should go through SECURITY DEFINER RPC functions

-- ============================================
-- 1. USER_CREDITS - Remove direct INSERT/UPDATE (use check_and_deduct_credit RPC)
-- ============================================
DROP POLICY IF EXISTS "Users can insert their credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their credits" ON user_credits;
-- Keep SELECT policy so users can view their own credits

-- ============================================
-- 2. USER_UNLOCKED_PERSONAS - Remove direct INSERT (create RPC function)
-- ============================================
DROP POLICY IF EXISTS "Users can unlock personas" ON user_unlocked_personas;

-- Create secure RPC function for unlocking personas with credit validation
CREATE OR REPLACE FUNCTION public.unlock_persona_with_credits(p_user_id uuid, p_persona_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_credits_used INTEGER;
  v_limit INTEGER;
  v_remaining INTEGER;
  v_already_unlocked BOOLEAN;
  v_is_starter BOOLEAN;
BEGIN
  -- SECURITY: Validate caller is operating on their own data
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Cannot unlock personas for other users');
  END IF;

  -- Get persona cost and check if starter
  SELECT credits_to_unlock, is_starter 
  INTO v_cost, v_is_starter
  FROM personas WHERE id = p_persona_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Persona not found');
  END IF;

  -- Check if already unlocked
  SELECT EXISTS (
    SELECT 1 FROM user_unlocked_personas
    WHERE user_id = p_user_id AND persona_id = p_persona_id
  ) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Persona already unlocked');
  END IF;

  -- Starter personas are free
  IF v_is_starter OR v_cost = 0 THEN
    INSERT INTO user_unlocked_personas (user_id, persona_id)
    VALUES (p_user_id, p_persona_id);
    RETURN jsonb_build_object('success', true, 'persona_id', p_persona_id, 'cost', 0);
  END IF;

  -- Get user credits
  SELECT credits_spent, monthly_credit_limit
  INTO v_credits_used, v_limit
  FROM user_credits WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User credits not found');
  END IF;
  
  -- Check if enough credits (NULL limit = unlimited)
  IF v_limit IS NOT NULL THEN
    v_remaining := v_limit - v_credits_used;
    IF v_remaining < v_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not enough credits', 'remaining', v_remaining, 'cost', v_cost);
    END IF;
  END IF;
  
  -- Deduct credits and unlock persona atomically
  UPDATE user_credits
  SET credits_spent = credits_spent + v_cost, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO user_unlocked_personas (user_id, persona_id)
  VALUES (p_user_id, p_persona_id);
  
  RETURN jsonb_build_object('success', true, 'persona_id', p_persona_id, 'cost', v_cost);
END;
$$;

-- ============================================
-- 3. USER_UNLOCKED_THEMES - Remove direct INSERT (unlock_theme_with_credits already exists)
-- ============================================
DROP POLICY IF EXISTS "Users can unlock themes" ON user_unlocked_themes;

-- ============================================
-- 4. USER_ACHIEVEMENTS - Remove direct INSERT/UPDATE (create RPC function)
-- ============================================
DROP POLICY IF EXISTS "Users can unlock achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update their achievement notifications" ON user_achievements;

-- Create secure RPC function for unlocking achievements with validation
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_user_id uuid, p_achievement_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_reward INTEGER;
  v_already_unlocked BOOLEAN;
  v_achievement_exists BOOLEAN;
BEGIN
  -- SECURITY: Validate caller is operating on their own data
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Cannot unlock achievements for other users');
  END IF;

  -- Check if achievement exists
  SELECT EXISTS (SELECT 1 FROM achievements WHERE id = p_achievement_id) INTO v_achievement_exists;
  IF NOT v_achievement_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Achievement not found');
  END IF;

  -- Check if already unlocked
  SELECT EXISTS (
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Achievement already unlocked');
  END IF;

  -- Get credits reward
  SELECT credits_reward INTO v_credits_reward
  FROM achievements WHERE id = p_achievement_id;

  -- Insert achievement unlock
  INSERT INTO user_achievements (user_id, achievement_id, notified)
  VALUES (p_user_id, p_achievement_id, false);
  
  -- Award credits if applicable
  IF v_credits_reward > 0 THEN
    UPDATE user_credits
    SET credits_earned = credits_earned + v_credits_reward, updated_at = now()
    WHERE user_id = p_user_id;
    
    -- If no record exists, create one with the reward
    IF NOT FOUND THEN
      INSERT INTO user_credits (user_id, credits_earned, subscription_tier)
      VALUES (p_user_id, v_credits_reward, 'starter_universe');
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'achievement_id', p_achievement_id, 'credits_awarded', v_credits_reward);
END;
$$;

-- Create function to mark achievement as notified
CREATE OR REPLACE FUNCTION public.mark_achievement_notified(p_user_id uuid, p_achievement_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE user_achievements
  SET notified = true
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 5. DAILY_USAGE - Remove direct INSERT/UPDATE (create RPC function)
-- ============================================
DROP POLICY IF EXISTS "Users can insert their usage" ON daily_usage;
DROP POLICY IF EXISTS "Users can update their usage" ON daily_usage;

-- Create secure RPC function for updating daily usage
CREATE OR REPLACE FUNCTION public.record_daily_usage(p_user_id uuid, p_generations integer DEFAULT 0, p_minutes integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  INSERT INTO daily_usage (user_id, usage_date, generations_count, time_spent_minutes)
  VALUES (p_user_id, CURRENT_DATE, p_generations, p_minutes)
  ON CONFLICT (user_id, usage_date) 
  DO UPDATE SET
    generations_count = daily_usage.generations_count + p_generations,
    time_spent_minutes = daily_usage.time_spent_minutes + p_minutes,
    updated_at = now();
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Add unique constraint if not exists for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_usage_user_date_unique'
  ) THEN
    ALTER TABLE daily_usage ADD CONSTRAINT daily_usage_user_date_unique UNIQUE (user_id, usage_date);
  END IF;
END $$;

-- ============================================
-- 6. USER_STREAKS - Remove direct INSERT/UPDATE (create RPC function)
-- ============================================
DROP POLICY IF EXISTS "Users can insert their streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update their streaks" ON user_streaks;

-- Create secure RPC function for updating streaks
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_active DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get current streak info
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM user_streaks WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- First time user
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE);
    RETURN jsonb_build_object('success', true, 'current_streak', 1, 'longest_streak', 1);
  END IF;
  
  -- Already active today
  IF v_last_active = CURRENT_DATE THEN
    RETURN jsonb_build_object('success', true, 'current_streak', v_current_streak, 'longest_streak', v_longest_streak);
  END IF;
  
  -- Calculate new streak
  IF v_last_active = CURRENT_DATE - 1 THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1; -- Streak broken
  END IF;
  
  -- Update streak
  UPDATE user_streaks
  SET 
    current_streak = v_new_streak,
    longest_streak = GREATEST(v_longest_streak, v_new_streak),
    last_active_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'current_streak', v_new_streak, 'longest_streak', GREATEST(v_longest_streak, v_new_streak));
END;
$$;