-- Studio visits tracking
CREATE TABLE public.studio_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Studio likes
CREATE TABLE public.studio_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(studio_id, user_id, owner_id)
);

-- Studio comments
CREATE TABLE public.studio_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES public.studio_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  content text NOT NULL,
  is_child_friendly boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seasonal studio events
CREATE TABLE public.studio_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  theme text NOT NULL DEFAULT 'seasonal',
  icon text NOT NULL DEFAULT '🎉',
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  bonus_credits integer DEFAULT 0,
  bonus_xp integer DEFAULT 0,
  exclusive_decoration_ids uuid[] DEFAULT '{}',
  exclusive_studio_ids uuid[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User event participation
CREATE TABLE public.user_event_participation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.studio_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  rewards_claimed boolean NOT NULL DEFAULT false,
  progress jsonb DEFAULT '{}',
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.studio_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_participation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for studio_visits
CREATE POLICY "Users can record visits" ON public.studio_visits FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Users can view visits to their studios" ON public.studio_visits FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = visitor_id);

-- RLS Policies for studio_likes
CREATE POLICY "Users can like studios" ON public.studio_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike studios" ON public.studio_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view likes" ON public.studio_likes FOR SELECT USING (true);

-- RLS Policies for studio_comments
CREATE POLICY "Users can comment on studios" ON public.studio_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.studio_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view comments" ON public.studio_comments FOR SELECT USING (true);

-- RLS Policies for studio_events
CREATE POLICY "Anyone can view active events" ON public.studio_events FOR SELECT USING (is_active = true);

-- RLS Policies for user_event_participation
CREATE POLICY "Users can join events" ON public.user_event_participation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own participation" ON public.user_event_participation FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.user_event_participation FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for social features
ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_comments;

-- Add some seasonal events
INSERT INTO public.studio_events (name, description, theme, icon, starts_at, ends_at, bonus_credits, bonus_xp) VALUES
('Winter Wonderland', 'Transform your studio into a magical winter paradise! Earn bonus rewards for winter-themed decorations.', 'winter', '❄️', now(), now() + interval '30 days', 50, 100),
('Cosmic Celebration', 'Journey through the stars! Special space-themed decorations and double XP on studio visits.', 'space', '🚀', now() + interval '31 days', now() + interval '60 days', 75, 150),
('Enchanted Spring', 'Bloom into creativity with magical spring themes and exclusive flower decorations.', 'spring', '🌸', now() + interval '61 days', now() + interval '90 days', 50, 100),
('Summer Festival', 'Celebrate summer with vibrant colors and tropical vibes! Beach-themed studio items available.', 'summer', '🌴', now() + interval '91 days', now() + interval '120 days', 60, 120);

-- Add studio-specific achievements
INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value, credits_reward, category, sort_order) VALUES
('studio_first_visitor', 'Welcome Guest', 'Receive your first studio visitor', '👋', 'studio_visits_received', 1, 10, 'social', 40),
('studio_popular', 'Popular Studio', 'Receive 10 studio visitors', '🌟', 'studio_visits_received', 10, 25, 'social', 41),
('studio_famous', 'Famous Creator', 'Receive 50 studio visitors', '🏆', 'studio_visits_received', 50, 50, 'social', 42),
('studio_decorator', 'Interior Designer', 'Place 10 decorations in your studio', '🎨', 'decorations_placed', 10, 20, 'creation', 43),
('studio_master', 'Studio Master', 'Unlock 5 different studios', '🏠', 'studios_unlocked', 5, 40, 'collection', 44),
('event_participant', 'Event Explorer', 'Participate in your first seasonal event', '🎉', 'events_joined', 1, 15, 'events', 45),
('studio_liked', 'Crowd Favorite', 'Receive 25 likes on your studios', '❤️', 'studio_likes_received', 25, 30, 'social', 46);

-- Function to record studio visit and update achievements
CREATE OR REPLACE FUNCTION public.record_studio_visit(p_visitor_id uuid, p_owner_id uuid, p_studio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_visitor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Don't count self-visits
  IF p_visitor_id = p_owner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot visit own studio');
  END IF;

  -- Record the visit
  INSERT INTO studio_visits (studio_id, visitor_id, owner_id)
  VALUES (p_studio_id, p_visitor_id, p_owner_id);

  RETURN jsonb_build_object('success', true);
END;
$$;