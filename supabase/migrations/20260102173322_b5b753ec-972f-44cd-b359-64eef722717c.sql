-- Create contributor badges table
CREATE TABLE public.contributor_badges (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏅',
  category text NOT NULL DEFAULT 'community',
  rarity text NOT NULL DEFAULT 'common',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contributor_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view badges
CREATE POLICY "Anyone can view contributor badges"
ON public.contributor_badges
FOR SELECT
USING (true);

-- Create user contributor badges table
CREATE TABLE public.user_contributor_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id text NOT NULL REFERENCES public.contributor_badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_contributor_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view earned badges (for displaying on profiles)
CREATE POLICY "Anyone can view earned badges"
ON public.user_contributor_badges
FOR SELECT
USING (true);

-- Insert initial contributor badges
INSERT INTO public.contributor_badges (id, name, description, icon, category, rarity, requirement_type, requirement_value, sort_order) VALUES
('platform_scout', 'Platform Scout', 'Suggested your first AI platform to the directory', '🔍', 'discovery', 'common', 'platforms_suggested', 1, 1),
('platform_curator', 'Platform Curator', 'Had 3 platform suggestions approved', '📋', 'discovery', 'rare', 'platforms_approved', 3, 2),
('platform_expert', 'Platform Expert', 'Had 10 platform suggestions approved', '🎓', 'discovery', 'epic', 'platforms_approved', 10, 3),
('helpful_voice', 'Helpful Voice', 'Left 10 kind comments on community creations', '💬', 'community', 'common', 'comments_posted', 10, 4),
('community_pillar', 'Community Pillar', 'Left 50 kind comments on community creations', '🏛️', 'community', 'rare', 'comments_posted', 50, 5),
('feedback_champion', 'Feedback Champion', 'Submitted detailed feedback to help improve the platform', '📝', 'feedback', 'common', 'feedback_submitted', 1, 6),
('beta_pioneer', 'Beta Pioneer', 'Joined as an early community member', '🚀', 'special', 'legendary', 'early_adopter', 1, 7),
('social_butterfly', 'Social Butterfly', 'Following 10+ creators in the community', '🦋', 'social', 'common', 'following_count', 10, 8),
('trendsetter', 'Trendsetter', 'Have 25+ followers in the community', '⭐', 'social', 'rare', 'followers_count', 25, 9),
('influencer', 'Influencer', 'Have 100+ followers in the community', '👑', 'social', 'epic', 'followers_count', 100, 10);

-- Function to award contributor badge
CREATE OR REPLACE FUNCTION public.award_contributor_badge(p_user_id uuid, p_badge_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_badge_exists BOOLEAN;
  v_already_earned BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT EXISTS (SELECT 1 FROM contributor_badges WHERE id = p_badge_id) INTO v_badge_exists;
  IF NOT v_badge_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Badge not found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_contributor_badges 
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO v_already_earned;
  
  IF v_already_earned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Badge already earned');
  END IF;

  INSERT INTO user_contributor_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id);
  
  RETURN jsonb_build_object('success', true, 'badge_id', p_badge_id);
END;
$$;