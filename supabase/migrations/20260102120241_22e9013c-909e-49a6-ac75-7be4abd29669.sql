-- Quest definitions table
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  story_intro TEXT, -- Narrative intro for immersion
  story_complete TEXT, -- Narrative completion text
  quest_type TEXT NOT NULL DEFAULT 'daily' CHECK (quest_type IN ('daily', 'weekly', 'story', 'special')),
  category TEXT NOT NULL DEFAULT 'creation' CHECK (category IN ('creation', 'exploration', 'social', 'mastery')),
  icon TEXT NOT NULL DEFAULT 'scroll',
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  requirement_type TEXT NOT NULL, -- e.g., 'generate_images', 'visit_page', 'unlock_persona'
  requirement_value INTEGER NOT NULL DEFAULT 1,
  credits_reward INTEGER NOT NULL DEFAULT 10,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  unlock_content_type TEXT, -- e.g., 'theme', 'persona', 'badge'
  unlock_content_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User quest progress table
CREATE TABLE public.user_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'claimed', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

-- User XP and level tracking
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Quest policies (public read)
CREATE POLICY "Anyone can view active quests" ON public.quests
  FOR SELECT USING (is_active = true);

-- User quest policies
CREATE POLICY "Users can view their quest progress" ON public.user_quests
  FOR SELECT USING (auth.uid() = user_id);

-- User level policies
CREATE POLICY "Users can view their level" ON public.user_levels
  FOR SELECT USING (auth.uid() = user_id);

-- Function to start a quest
CREATE OR REPLACE FUNCTION public.start_quest(p_user_id UUID, p_quest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quest_exists BOOLEAN;
  v_already_started BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Check quest exists and is active
  SELECT EXISTS (SELECT 1 FROM quests WHERE id = p_quest_id AND is_active = true) INTO v_quest_exists;
  IF NOT v_quest_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not found or inactive');
  END IF;

  -- Check if already started
  SELECT EXISTS (
    SELECT 1 FROM user_quests 
    WHERE user_id = p_user_id AND quest_id = p_quest_id AND status != 'expired'
  ) INTO v_already_started;
  
  IF v_already_started THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest already started');
  END IF;

  -- Start the quest
  INSERT INTO user_quests (user_id, quest_id, status, started_at)
  VALUES (p_user_id, p_quest_id, 'in_progress', now())
  ON CONFLICT (user_id, quest_id) 
  DO UPDATE SET status = 'in_progress', started_at = now(), progress = 0;

  RETURN jsonb_build_object('success', true, 'quest_id', p_quest_id);
END;
$$;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION public.update_quest_progress(p_user_id UUID, p_requirement_type TEXT, p_increment INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quest RECORD;
  v_updated_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Update all in-progress quests matching the requirement type
  FOR v_quest IN
    SELECT uq.id, uq.progress, q.requirement_value, q.id as quest_id
    FROM user_quests uq
    JOIN quests q ON q.id = uq.quest_id
    WHERE uq.user_id = p_user_id 
      AND uq.status = 'in_progress'
      AND q.requirement_type = p_requirement_type
      AND q.is_active = true
  LOOP
    UPDATE user_quests
    SET 
      progress = LEAST(progress + p_increment, v_quest.requirement_value),
      status = CASE 
        WHEN progress + p_increment >= v_quest.requirement_value THEN 'completed'
        ELSE 'in_progress'
      END,
      completed_at = CASE 
        WHEN progress + p_increment >= v_quest.requirement_value THEN now()
        ELSE NULL
      END
    WHERE id = v_quest.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'quests_updated', v_updated_count);
END;
$$;

-- Function to claim quest rewards
CREATE OR REPLACE FUNCTION public.claim_quest_reward(p_user_id UUID, p_quest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quest RECORD;
  v_user_quest RECORD;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get quest details
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not found');
  END IF;

  -- Check user quest status
  SELECT * INTO v_user_quest 
  FROM user_quests 
  WHERE user_id = p_user_id AND quest_id = p_quest_id;
  
  IF NOT FOUND OR v_user_quest.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not completed');
  END IF;

  -- Mark as claimed
  UPDATE user_quests
  SET status = 'claimed', claimed_at = now()
  WHERE user_id = p_user_id AND quest_id = p_quest_id;

  -- Award credits
  IF v_quest.credits_reward > 0 THEN
    UPDATE user_credits
    SET credits_earned = credits_earned + v_quest.credits_reward, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Award XP and update level
  INSERT INTO user_levels (user_id, current_xp, total_xp, quests_completed)
  VALUES (p_user_id, v_quest.xp_reward, v_quest.xp_reward, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_xp = user_levels.current_xp + v_quest.xp_reward,
    total_xp = user_levels.total_xp + v_quest.xp_reward,
    quests_completed = user_levels.quests_completed + 1,
    updated_at = now();

  -- Calculate new level (100 XP per level, exponential)
  SELECT current_xp INTO v_new_xp FROM user_levels WHERE user_id = p_user_id;
  v_new_level := GREATEST(1, FLOOR(SQRT(v_new_xp / 25)) + 1);
  
  UPDATE user_levels SET current_level = v_new_level WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'credits_awarded', v_quest.credits_reward,
    'xp_awarded', v_quest.xp_reward,
    'new_level', v_new_level,
    'unlock_type', v_quest.unlock_content_type,
    'unlock_id', v_quest.unlock_content_id
  );
END;
$$;

-- Insert starter quests
INSERT INTO public.quests (title, description, story_intro, story_complete, quest_type, category, icon, difficulty, requirement_type, requirement_value, credits_reward, xp_reward, sort_order) VALUES
-- Daily Quests
('First Creation', 'Generate your first image today', 'Every great journey begins with a single step. Create something magical today!', 'Brilliant! Your first creation of the day sparkles with potential. The universe takes notice.', 'daily', 'creation', 'sparkles', 1, 'generate_images', 1, 5, 10, 1),
('Creative Trio', 'Generate 3 images today', 'The number three holds mystical power. Create a trio of wonders.', 'A trinity of creations! Your artistic energy flows stronger now.', 'daily', 'creation', 'image', 2, 'generate_images', 3, 15, 25, 2),
('Explorer''s Path', 'Visit 3 different pages', 'Curiosity opens new doors. Explore the realms of NexusTouch.', 'A true explorer! You''ve discovered hidden corners of our universe.', 'daily', 'exploration', 'compass', 1, 'visit_pages', 3, 5, 15, 3),
('Social Butterfly', 'Like 5 community creations', 'Art thrives when appreciated. Spread joy through the community!', 'Your encouragement brightens the creative universe!', 'daily', 'social', 'heart', 1, 'like_images', 5, 10, 20, 4),

-- Weekly Quests
('Master Creator', 'Generate 15 images this week', 'A week of creation awaits. How many worlds will you bring to life?', 'Master Creator indeed! 15 unique visions now exist because of you.', 'weekly', 'creation', 'crown', 3, 'generate_images', 15, 50, 100, 10),
('Persona Collector', 'Unlock a new persona', 'Each persona holds unique creative powers. Discover a new ally!', 'A new persona joins your creative arsenal. Their power is now yours!', 'weekly', 'mastery', 'user-plus', 3, 'unlock_persona', 1, 30, 75, 11),
('Community Champion', 'Leave 10 comments on community art', 'Words of encouragement build bridges. Connect with fellow creators!', 'Champion of community! Your words have touched many hearts.', 'weekly', 'social', 'message-circle', 2, 'post_comments', 10, 40, 80, 12),
('Streak Keeper', 'Maintain a 7-day streak', 'Consistency is the key to mastery. Return every day this week!', 'Seven days strong! Your dedication is truly inspiring.', 'weekly', 'mastery', 'flame', 4, 'maintain_streak', 7, 75, 150, 13),

-- Story Quests (permanent progression)
('The Awakening', 'Complete the onboarding tutorial', 'Welcome, young creator. Your journey through the stars begins now...', 'You have awakened to your creative potential. The universe welcomes you!', 'story', 'exploration', 'star', 1, 'complete_onboarding', 1, 25, 50, 100),
('Finding Your Voice', 'Try 5 different style presets', 'Every artist has a unique voice. Experiment to find yours.', 'You''ve explored many styles. Your artistic voice grows clearer!', 'story', 'mastery', 'palette', 2, 'try_styles', 5, 35, 75, 101),
('The Gallery Opens', 'Share your first creation publicly', 'True art is meant to be shared. Open your gallery to the world!', 'Your gallery doors are open! Others can now admire your work.', 'story', 'social', 'door-open', 2, 'share_public', 1, 40, 100, 102),
('Rising Star', 'Receive 25 likes on your creations', 'Recognition follows great work. Let your light shine bright!', 'A rising star emerges! The community celebrates your artistry.', 'story', 'social', 'trending-up', 3, 'receive_likes', 25, 60, 125, 103),
('Master of Personas', 'Unlock 5 different personas', 'Master the many faces of creativity. Each persona unlocks new possibilities.', 'Five personas answer your call! You have become a Master of Personas.', 'story', 'mastery', 'users', 4, 'unlock_personas_total', 5, 100, 200, 104),
('Legend of Creation', 'Generate 100 total images', 'One hundred creations mark a true legend. Will you reach this milestone?', 'LEGENDARY! 100 creations flow from your imagination. You are now a Legend of Creation!', 'story', 'creation', 'trophy', 5, 'total_generations', 100, 150, 300, 105);