-- Security Remediation: Fix Remaining RLS Policy Issues

-- 1. Fix feedback_submissions - restrict viewing to only authenticated users viewing their own feedback
-- Remove the current policy that might allow viewing anonymous feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON feedback_submissions;

-- Create stricter policies: users can only view their OWN feedback (not anonymous)
CREATE POLICY "Users can only view their own feedback" ON feedback_submissions
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Restrict INSERT to authenticated users only (no anonymous submissions)
CREATE POLICY "Only authenticated users can submit feedback" ON feedback_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Verify/recreate user_follows policy - require authentication
DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
DROP POLICY IF EXISTS "Authenticated users can view follows" ON user_follows;

CREATE POLICY "Authenticated users can view follows" ON user_follows
  FOR SELECT TO authenticated 
  USING (true);

-- 3. Verify/recreate image_likes policy - require authentication
DROP POLICY IF EXISTS "Anyone can view likes" ON image_likes;
DROP POLICY IF EXISTS "Authenticated users can view likes" ON image_likes;

CREATE POLICY "Authenticated users can view likes" ON image_likes
  FOR SELECT TO authenticated 
  USING (true);

-- 4. Fix platform_suggestions - require authentication for submissions
DROP POLICY IF EXISTS "Anyone can submit suggestions" ON platform_suggestions;

CREATE POLICY "Authenticated users can submit suggestions" ON platform_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also fix the SELECT policy to only allow viewing own suggestions
DROP POLICY IF EXISTS "Users can view own suggestions" ON platform_suggestions;

CREATE POLICY "Users can view their own suggestions" ON platform_suggestions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);