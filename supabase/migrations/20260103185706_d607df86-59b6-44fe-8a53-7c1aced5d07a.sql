-- Fix error-level security issues

-- =============================================================================
-- Issue 1: profiles table is publicly readable (scrapers could harvest data)
-- Solution: Use can_view_profile function to restrict access to connected users
-- =============================================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure policy using the existing can_view_profile function
-- Users can only view profiles of: themselves, people they follow, friends, or community contributors
CREATE POLICY "Users can view profiles with social connection"
ON public.profiles FOR SELECT
TO authenticated
USING (public.can_view_profile(id));

-- Ensure users can still update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure users can insert their own profile (for new users)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =============================================================================
-- Issue 2: Children can view their own parental controls (allows circumvention)
-- Solution: Remove child SELECT access, only parents can view controls
-- =============================================================================

-- Drop the vulnerable child viewing policy
DROP POLICY IF EXISTS "Children can view their own controls" ON public.parental_controls;

-- Ensure only parents can view parental controls
-- The existing "Parents can manage their controls" policy should handle SELECT for parents
-- Let's verify and create a clean parent-only SELECT policy
DROP POLICY IF EXISTS "Parents can view their controls" ON public.parental_controls;
DROP POLICY IF EXISTS "Parents can manage their controls" ON public.parental_controls;

-- Create comprehensive parent-only policies
CREATE POLICY "Parents can view parental controls"
ON public.parental_controls FOR SELECT
TO authenticated
USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can create parental controls"
ON public.parental_controls FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can update parental controls"
ON public.parental_controls FOR UPDATE
TO authenticated
USING (auth.uid() = parent_user_id)
WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can delete parental controls"
ON public.parental_controls FOR DELETE
TO authenticated
USING (auth.uid() = parent_user_id);