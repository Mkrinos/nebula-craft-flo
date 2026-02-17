-- Create table for platform suggestions
CREATE TABLE public.platform_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  platform_name TEXT NOT NULL,
  platform_url TEXT,
  category TEXT NOT NULL,
  age_range TEXT NOT NULL,
  description TEXT NOT NULL,
  why_recommended TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit suggestions
CREATE POLICY "Anyone can submit suggestions" 
ON public.platform_suggestions 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions" 
ON public.platform_suggestions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);