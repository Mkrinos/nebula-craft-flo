-- Create studio spaces table (predefined templates)
CREATE TABLE public.studio_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'default',
  background_style TEXT NOT NULL DEFAULT 'starfield',
  unlock_method TEXT NOT NULL DEFAULT 'achievement', -- 'achievement', 'quest', 'credits', 'starter'
  unlock_requirement_id TEXT, -- achievement_id or quest_id
  credits_cost INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decorations table (items to place in studios)
CREATE TABLE public.studio_decorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'furniture', -- 'furniture', 'art', 'lighting', 'plants', 'tech'
  icon TEXT NOT NULL DEFAULT '🎨',
  unlock_method TEXT NOT NULL DEFAULT 'achievement',
  unlock_requirement_id TEXT,
  credits_cost INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT false,
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User unlocked studios
CREATE TABLE public.user_studios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  studio_id UUID NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, studio_id)
);

-- User unlocked decorations
CREATE TABLE public.user_decorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  decoration_id UUID NOT NULL REFERENCES public.studio_decorations(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, decoration_id)
);

-- User placed decorations in their active studio
CREATE TABLE public.user_studio_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  studio_id UUID NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  decoration_id UUID NOT NULL REFERENCES public.studio_decorations(id) ON DELETE CASCADE,
  position_x INTEGER DEFAULT 50,
  position_y INTEGER DEFAULT 50,
  scale DECIMAL DEFAULT 1.0,
  rotation INTEGER DEFAULT 0,
  placed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_studio_placements ENABLE ROW LEVEL SECURITY;

-- Studio spaces and decorations are viewable by all authenticated users
CREATE POLICY "Anyone can view studio spaces" ON public.studio_spaces FOR SELECT USING (true);
CREATE POLICY "Anyone can view decorations" ON public.studio_decorations FOR SELECT USING (true);

-- User studios policies
CREATE POLICY "Users can view own studios" ON public.user_studios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own studios" ON public.user_studios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own studios" ON public.user_studios FOR UPDATE USING (auth.uid() = user_id);

-- User decorations policies  
CREATE POLICY "Users can view own decorations" ON public.user_decorations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decorations" ON public.user_decorations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User placements policies
CREATE POLICY "Users can view own placements" ON public.user_studio_placements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own placements" ON public.user_studio_placements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own placements" ON public.user_studio_placements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own placements" ON public.user_studio_placements FOR DELETE USING (auth.uid() = user_id);

-- Function to unlock a studio space
CREATE OR REPLACE FUNCTION public.unlock_studio(p_user_id UUID, p_studio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_studio RECORD;
  v_already_unlocked BOOLEAN;
  v_credits_used INTEGER;
  v_limit INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_studio FROM studio_spaces WHERE id = p_studio_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Studio not found');
  END IF;

  SELECT EXISTS (SELECT 1 FROM user_studios WHERE user_id = p_user_id AND studio_id = p_studio_id) INTO v_already_unlocked;
  IF v_already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already unlocked');
  END IF;

  -- Handle credits-based unlock
  IF v_studio.unlock_method = 'credits' AND v_studio.credits_cost > 0 THEN
    SELECT credits_spent, monthly_credit_limit INTO v_credits_used, v_limit FROM user_credits WHERE user_id = p_user_id;
    IF v_limit IS NOT NULL AND (v_limit - v_credits_used) < v_studio.credits_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not enough credits');
    END IF;
    UPDATE user_credits SET credits_spent = credits_spent + v_studio.credits_cost WHERE user_id = p_user_id;
  END IF;

  INSERT INTO user_studios (user_id, studio_id) VALUES (p_user_id, p_studio_id);
  RETURN jsonb_build_object('success', true, 'studio_id', p_studio_id);
END;
$$;

-- Function to set active studio
CREATE OR REPLACE FUNCTION public.set_active_studio(p_user_id UUID, p_studio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Check if user owns this studio
  IF NOT EXISTS (SELECT 1 FROM user_studios WHERE user_id = p_user_id AND studio_id = p_studio_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Studio not owned');
  END IF;

  -- Deactivate all studios
  UPDATE user_studios SET is_active = false WHERE user_id = p_user_id;
  -- Activate selected studio
  UPDATE user_studios SET is_active = true WHERE user_id = p_user_id AND studio_id = p_studio_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Insert starter studios and decorations
INSERT INTO public.studio_spaces (name, description, theme, background_style, unlock_method, is_starter, sort_order) VALUES
('Starter Workshop', 'Your first creative space - a cozy workshop to begin your journey', 'cozy', 'gradient', 'starter', true, 1),
('Nebula Observatory', 'A cosmic observation deck among the stars', 'cosmic', 'starfield', 'achievement', false, 2),
('Crystal Cavern', 'A mystical underground studio filled with glowing crystals', 'mystical', 'crystals', 'quest', false, 3),
('Floating Island', 'A serene island floating in the clouds', 'nature', 'clouds', 'credits', false, 4),
('Neon Arcade', 'A retro-futuristic gaming paradise', 'retro', 'neon', 'achievement', false, 5),
('Ancient Library', 'A grand library filled with knowledge and magic', 'ancient', 'books', 'quest', false, 6);

INSERT INTO public.studio_decorations (name, description, category, icon, unlock_method, is_starter, rarity, sort_order) VALUES
('Creative Desk', 'A simple desk to work on your masterpieces', 'furniture', '🪑', 'starter', true, 'common', 1),
('Inspiration Board', 'Pin your favorite ideas here', 'art', '📌', 'starter', true, 'common', 2),
('Desk Lamp', 'Warm light for late-night creating', 'lighting', '💡', 'starter', true, 'common', 3),
('Potted Plant', 'A touch of nature for your space', 'plants', '🪴', 'starter', true, 'common', 4),
('Holographic Display', 'Futuristic display for your creations', 'tech', '📺', 'achievement', false, 'rare', 5),
('Crystal Ball', 'See visions of your next creation', 'art', '🔮', 'quest', false, 'rare', 6),
('Rainbow Fountain', 'A magical fountain of colors', 'art', '⛲', 'achievement', false, 'epic', 7),
('Star Chandelier', 'Illumination from captured starlight', 'lighting', '✨', 'quest', false, 'epic', 8),
('Portal Frame', 'A gateway to other creative dimensions', 'tech', '🌀', 'achievement', false, 'legendary', 9),
('Phoenix Statue', 'A majestic phoenix frozen in time', 'art', '🦅', 'quest', false, 'legendary', 10);