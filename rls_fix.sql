/*
  NexusTouch RLS Audit & Fix Script
  =================================
  
  Run this script in your Supabase SQL Editor.
  
  Part 1: Verification Queries (Run first to check status)
  Part 2: Policy Fixes (Run to apply security rules)
*/

-- =================================================================
-- PART 1: VERIFICATION QUERIES
-- =================================================================

-- 1. Check if RLS is enabled for tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'quests', 
  'achievements', 
  'user_levels', 
  'user_quests', 
  'personas', 
  'music_tracks', 
  'user_accessibility_settings', 
  'profiles',
  'generated_images'
);

-- 2. List existing policies
SELECT
    tablename,
    policyname,
    cmd AS operation,
    qual AS using_expression,
    with_check AS with_check_expression
FROM
    pg_policies
WHERE
    schemaname = 'public'
AND tablename IN (
  'quests', 
  'achievements', 
  'user_levels', 
  'user_quests', 
  'personas', 
  'music_tracks', 
  'user_accessibility_settings', 
  'profiles',
  'generated_images'
)
ORDER BY
    tablename, policyname;


-- =================================================================
-- PART 2: FIX POLICIES & ENABLE RLS
-- =================================================================

-- -----------------------------------------------------------------
-- 1. Quests (Read-only for users, managed by Admin)
-- -----------------------------------------------------------------
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Quests are viewable by everyone" ON public.quests;
DROP POLICY IF EXISTS "Admins can manage quests" ON public.quests;

-- Policies
CREATE POLICY "Quests are viewable by everyone" 
ON public.quests FOR SELECT 
USING (true);

-- (Write access defaults to 'none' (Service Role only) unless policy exists)


-- -----------------------------------------------------------------
-- 2. Achievements (Read-only for users)
-- -----------------------------------------------------------------
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements viewable by everyone" ON public.achievements;

CREATE POLICY "Achievements viewable by everyone" 
ON public.achievements FOR SELECT 
USING (true);


-- -----------------------------------------------------------------
-- 3. User Progress (user_levels & user_quests)
-- -----------------------------------------------------------------

-- user_levels
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User levels viewable by everyone" ON public.user_levels;
DROP POLICY IF EXISTS "Users can update own level" ON public.user_levels;

-- Public read (for leaderboards)
CREATE POLICY "User levels viewable by everyone" 
ON public.user_levels FOR SELECT 
USING (true);

-- Owner write
CREATE POLICY "Users can update own level" 
ON public.user_levels FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level" 
ON public.user_levels FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- user_quests
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quests" ON public.user_quests;
DROP POLICY IF EXISTS "Users can manage own quests" ON public.user_quests;

CREATE POLICY "Users can view own quests" 
ON public.user_quests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quests" 
ON public.user_quests FOR ALL 
USING (auth.uid() = user_id);


-- -----------------------------------------------------------------
-- 4. Personas (Read-only for users)
-- -----------------------------------------------------------------
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personas viewable by everyone" ON public.personas;

CREATE POLICY "Personas viewable by everyone" 
ON public.personas FOR SELECT 
USING (true);


-- -----------------------------------------------------------------
-- 5. Music Tracks (Public read, User upload if allowed)
-- -----------------------------------------------------------------
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Music tracks viewable by everyone" ON public.music_tracks;
DROP POLICY IF EXISTS "Users can manage uploaded tracks" ON public.music_tracks;

CREATE POLICY "Music tracks viewable by everyone" 
ON public.music_tracks FOR SELECT 
USING (true);

CREATE POLICY "Users can manage uploaded tracks" 
ON public.music_tracks FOR ALL 
USING (auth.uid() = uploaded_by::uuid);


-- -----------------------------------------------------------------
-- 6. User Preferences (user_accessibility_settings & profiles)
-- -----------------------------------------------------------------

-- user_accessibility_settings
ALTER TABLE public.user_accessibility_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_accessibility_settings;

CREATE POLICY "Users can manage own settings" 
ON public.user_accessibility_settings FOR ALL 
USING (auth.uid() = user_id);

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Note: Profile insertion handled by Supabase Auth Triggers typically


-- -----------------------------------------------------------------
-- 7. Community Posts (generated_images)
-- -----------------------------------------------------------------
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public images are viewable by everyone" ON public.generated_images;
DROP POLICY IF EXISTS "Users can view own private images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can manage own images" ON public.generated_images;

-- Select: Public OR Owner
CREATE POLICY "Public images are viewable by everyone" 
ON public.generated_images FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view own private images" 
ON public.generated_images FOR SELECT 
USING (auth.uid() = user_id);

-- Write: Owner only
CREATE POLICY "Users can manage own images" 
ON public.generated_images FOR ALL 
USING (auth.uid() = user_id);
