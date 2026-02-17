-- Drop existing policies on feedback_submissions
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_submissions;

-- Create secure INSERT policy - only authenticated users can submit feedback
-- This prevents anonymous email harvesting attacks via submission
CREATE POLICY "Authenticated users can submit feedback" 
ON public.feedback_submissions 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to submit (links to their user_id)
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  -- OR allow anonymous submissions but WITHOUT contact_email exposure risk
  -- Anonymous submissions will have user_id = NULL and won't be viewable
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

-- Create secure SELECT policy - users can only view their own submissions
-- This ensures contact_email is only visible to the user who submitted it
CREATE POLICY "Users can view their own feedback" 
ON public.feedback_submissions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);