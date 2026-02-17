-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all images" ON public.generated_images;

-- Create a secure SELECT policy that respects the is_public flag
-- Users can only see: their own images OR public images
CREATE POLICY "Users can view own or public images" 
ON public.generated_images 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR (is_public = true)
);