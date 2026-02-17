-- Create achievements table
CREATE TABLE public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL, -- 'images_generated', 'personas_unlocked', 'consecutive_days', 'credits_spent', etc.
  requirement_value integer NOT NULL,
  credits_reward integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Create user streaks table for tracking consecutive days
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Achievements are public to view
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- User achievements policies
CREATE POLICY "Users can view their achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their achievement notifications"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- User streaks policies
CREATE POLICY "Users can view their streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their streaks"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (id, name, description, icon, category, requirement_type, requirement_value, credits_reward, sort_order) VALUES
  ('first_image', 'First Creation', 'Generate your first image', 'sparkles', 'creator', 'images_generated', 1, 5, 1),
  ('creative_10', 'Creative Spark', 'Generate 10 images', 'zap', 'creator', 'images_generated', 10, 10, 2),
  ('prolific_50', 'Prolific Artist', 'Generate 50 images', 'palette', 'creator', 'images_generated', 50, 25, 3),
  ('master_100', 'Master Creator', 'Generate 100 images', 'crown', 'creator', 'images_generated', 100, 50, 4),
  ('first_persona', 'Identity Found', 'Unlock your first persona', 'user', 'explorer', 'personas_unlocked', 1, 5, 10),
  ('collector_2', 'Persona Collector', 'Unlock 2 personas', 'users', 'explorer', 'personas_unlocked', 2, 15, 11),
  ('collector_5', 'Persona Enthusiast', 'Unlock 5 personas', 'star', 'explorer', 'personas_unlocked', 5, 30, 12),
  ('streak_3', 'Getting Started', 'Use the app 3 days in a row', 'flame', 'dedication', 'consecutive_days', 3, 10, 20),
  ('streak_7', 'Weekly Warrior', 'Use the app 7 days in a row', 'fire', 'dedication', 'consecutive_days', 7, 25, 21),
  ('streak_30', 'Monthly Master', 'Use the app 30 days in a row', 'trophy', 'dedication', 'consecutive_days', 30, 100, 22);