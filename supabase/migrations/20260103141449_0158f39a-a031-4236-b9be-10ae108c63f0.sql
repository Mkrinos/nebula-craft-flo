-- Create table for scheduled feature releases
CREATE TABLE public.feature_rollouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_category TEXT NOT NULL, -- 'gamification_depth', 'immersive_experience', 'cross_platform_polish'
  feature_name TEXT NOT NULL,
  feature_description TEXT NOT NULL,
  release_month INTEGER NOT NULL CHECK (release_month >= 1 AND release_month <= 12),
  release_year INTEGER NOT NULL CHECK (release_year >= 2025),
  is_released BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  dependencies TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(feature_name, release_year)
);

-- Enable RLS
ALTER TABLE public.feature_rollouts ENABLE ROW LEVEL SECURITY;

-- Public read access for feature releases
CREATE POLICY "Feature rollouts are publicly readable"
ON public.feature_rollouts
FOR SELECT
USING (true);

-- Create table for user accessibility preferences
CREATE TABLE public.user_accessibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  high_contrast_enabled BOOLEAN DEFAULT false,
  reduced_motion_enabled BOOLEAN DEFAULT false,
  screen_reader_optimized BOOLEAN DEFAULT false,
  font_size_scale DECIMAL(3,2) DEFAULT 1.00 CHECK (font_size_scale >= 0.75 AND font_size_scale <= 2.00),
  keyboard_navigation_enhanced BOOLEAN DEFAULT true,
  focus_indicators_enhanced BOOLEAN DEFAULT true,
  audio_descriptions_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_accessibility_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own settings
CREATE POLICY "Users can view their own accessibility settings"
ON public.user_accessibility_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own settings
CREATE POLICY "Users can create their own accessibility settings"
ON public.user_accessibility_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own accessibility settings"
ON public.user_accessibility_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert scheduled feature rollouts for the next 3 months
INSERT INTO public.feature_rollouts (feature_category, feature_name, feature_description, release_month, release_year, priority, metadata) VALUES
-- February 2025 - Gamification Depth
('gamification_depth', 'daily_reward_calendar', 'Daily login reward calendar with streak bonuses and special weekly rewards', 2, 2025, 1, '{"rewards": ["credits", "themes", "decorations"], "streak_multipliers": [1, 1.5, 2, 3]}'),
('gamification_depth', 'collaborative_quests', 'Team-based quests allowing friends to work together toward shared goals', 2, 2025, 2, '{"max_team_size": 4, "quest_types": ["creative", "social", "exploration"]}'),
('gamification_depth', 'achievement_showcase', 'Public profile section to display favorite achievements and rare badges', 2, 2025, 3, '{"max_showcase_items": 6, "rarity_highlight": true}'),

-- March 2025 - Immersive Experience
('immersive_experience', 'page_transitions', 'Smooth animated transitions between pages with persona-themed effects', 3, 2025, 1, '{"transition_types": ["fade", "slide", "morph"], "persona_specific": true}'),
('immersive_experience', 'contextual_ai_companion', 'AI mascot that reacts to user actions with tips and encouragement', 3, 2025, 2, '{"characters": ["philosopher", "scifi_bot", "creative_muse"], "trigger_events": ["achievement", "quest_complete", "idle"]}'),
('immersive_experience', 'ambient_soundscapes', 'Optional background audio themes that match the current UI theme', 3, 2025, 3, '{"themes": ["space", "nature", "cyberpunk", "minimal"], "volume_control": true}'),

-- April 2025 - Cross-Platform Polish
('cross_platform_polish', 'offline_action_queue', 'Queue actions when offline and sync automatically when reconnected', 4, 2025, 1, '{"queued_actions": ["likes", "comments", "saves"], "max_queue_size": 50}'),
('cross_platform_polish', 'gesture_shortcuts', 'Customizable swipe and gesture shortcuts for power users', 4, 2025, 2, '{"gestures": ["swipe", "pinch", "long_press"], "customizable": true}'),
('cross_platform_polish', 'adaptive_loading', 'Smart loading strategies based on device capabilities and connection', 4, 2025, 3, '{"strategies": ["lazy", "eager", "progressive"], "connection_aware": true}');

-- Create index for efficient querying
CREATE INDEX idx_feature_rollouts_release ON public.feature_rollouts(release_year, release_month);
CREATE INDEX idx_feature_rollouts_category ON public.feature_rollouts(feature_category);