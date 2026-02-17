-- Add policy for children to view their own parental controls (read-only)
-- This allows children to see what restrictions apply to them
CREATE POLICY "Children can view their own controls"
ON public.parental_controls
FOR SELECT
USING (auth.uid() = child_user_id);

-- Ensure feedback_submissions has explicit protection
-- Add a unique constraint on session_id + feedback_type to prevent duplicate spam
ALTER TABLE public.feedback_submissions
ADD CONSTRAINT unique_session_feedback 
UNIQUE (session_id, feedback_type);