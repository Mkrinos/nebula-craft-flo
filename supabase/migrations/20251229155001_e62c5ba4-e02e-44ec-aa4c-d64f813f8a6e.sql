-- Create a table for user's favorite prompts
CREATE TABLE public.favorite_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate favorites per user
CREATE UNIQUE INDEX idx_unique_user_prompt ON public.favorite_prompts(user_id, prompt_text);

-- Enable Row Level Security
ALTER TABLE public.favorite_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites" 
ON public.favorite_prompts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.favorite_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorite_prompts 
FOR DELETE 
USING (auth.uid() = user_id);