-- Create personas table with pre-defined AI personas
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  style TEXT NOT NULL,
  avatar_url TEXT,
  credits_to_unlock INTEGER NOT NULL DEFAULT 0,
  is_starter BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_unlocked_personas table to track which personas each user has unlocked
CREATE TABLE public.user_unlocked_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, persona_id)
);

-- Create user_credits table to track credits for unlocking
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocked_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Personas are publicly viewable (catalog)
CREATE POLICY "Anyone can view personas" ON public.personas FOR SELECT USING (true);

-- Users can view their own unlocked personas
CREATE POLICY "Users can view their unlocked personas" ON public.user_unlocked_personas 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own unlocked personas
CREATE POLICY "Users can unlock personas" ON public.user_unlocked_personas 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own credits
CREATE POLICY "Users can view their credits" ON public.user_credits 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own credits
CREATE POLICY "Users can insert their credits" ON public.user_credits 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own credits
CREATE POLICY "Users can update their credits" ON public.user_credits 
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert the 20 AI personas (4 starters, 16 locked)
INSERT INTO public.personas (name, description, style, credits_to_unlock, is_starter, sort_order) VALUES
-- 4 Starter Personas (free)
('Cyber Artist', 'Neon-infused cyberpunk aesthetic with holographic elements and digital glitch effects', 'Cyberpunk', 0, true, 1),
('Dream Weaver', 'Ethereal and surreal dreamscape compositions with floating elements and soft gradients', 'Surreal', 0, true, 2),
('Pixel Master', 'Retro pixel art with modern twist, featuring vibrant 8-bit and 16-bit styled creations', 'Pixel Art', 0, true, 3),
('Nature Spirit', 'Organic forms blended with fantasy elements, mystical forests and enchanted creatures', 'Fantasy', 0, true, 4),

-- 16 Unlockable Personas
('Neon Nomad', 'Urban nightscapes with vibrant neon lighting and rain-soaked streets', 'Neo-Noir', 50, false, 5),
('Cosmic Voyager', 'Deep space exploration with nebulae, galaxies, and celestial phenomena', 'Space Art', 75, false, 6),
('Steampunk Engineer', 'Victorian-era machinery with brass gears, steam engines, and clockwork designs', 'Steampunk', 100, false, 7),
('Anime Sensei', 'Japanese animation style with dynamic poses and expressive characters', 'Anime', 100, false, 8),
('Abstract Expressionist', 'Bold color splashes, emotional brushstrokes, and non-representational forms', 'Abstract', 125, false, 9),
('Vintage Chronicler', 'Nostalgic retro aesthetics from the 50s-80s with warm, faded tones', 'Vintage', 125, false, 10),
('Gothic Poet', 'Dark romantic imagery with Victorian gothic architecture and moonlit scenes', 'Gothic', 150, false, 11),
('Watercolor Dreamer', 'Soft, flowing watercolor effects with delicate color bleeding and transparency', 'Watercolor', 150, false, 12),
('Minimalist Zen', 'Clean, simple compositions with negative space and subtle elegance', 'Minimalist', 175, false, 13),
('Comic Book Hero', 'Bold outlines, halftone dots, and dynamic superhero action scenes', 'Comic Art', 175, false, 14),
('Art Deco Designer', 'Geometric patterns, gold accents, and 1920s glamour aesthetics', 'Art Deco', 200, false, 15),
('Vaporwave Prophet', 'Retro-futuristic aesthetics with glitchy visuals and nostalgic 80s/90s vibes', 'Vaporwave', 200, false, 16),
('Oil Painting Master', 'Classical oil painting techniques with rich textures and depth', 'Oil Painting', 250, false, 17),
('Kawaii Creator', 'Cute Japanese pop culture style with pastel colors and adorable characters', 'Kawaii', 250, false, 18),
('Mythical Sage', 'Ancient mythology and legendary creatures from world cultures', 'Mythology', 300, false, 19),
('Photorealist', 'Hyper-realistic imagery indistinguishable from photographs', 'Photorealistic', 300, false, 20);