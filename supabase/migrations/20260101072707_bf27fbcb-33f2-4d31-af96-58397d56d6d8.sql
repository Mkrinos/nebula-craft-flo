-- Fix 1: Add extra safety to feedback_submissions SELECT policy
-- Ensure anonymous feedback (user_id IS NULL) cannot be viewed by anyone
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_submissions;

CREATE POLICY "Users can view their own feedback"
ON public.feedback_submissions
FOR SELECT
USING (
  user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Note: profiles table policy "(auth.uid() = id)" is already correctly restrictive
-- The id column IS the user's auth.uid(), so users can only see their own profile