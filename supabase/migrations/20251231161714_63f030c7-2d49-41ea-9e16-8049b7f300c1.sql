-- Create table for platform favorites
CREATE TABLE public.platform_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform_id)
);

-- Enable RLS
ALTER TABLE public.platform_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" 
ON public.platform_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites" 
ON public.platform_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can remove favorites
CREATE POLICY "Users can remove favorites" 
ON public.platform_favorites 
FOR DELETE 
USING (auth.uid() = user_id);