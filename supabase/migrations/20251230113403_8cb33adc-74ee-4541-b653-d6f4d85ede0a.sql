-- Create feedback submissions table
CREATE TABLE public.feedback_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Common fields
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('young_explorer', 'parent_guardian')),
  session_id TEXT NOT NULL,
  device_type TEXT,
  language TEXT DEFAULT 'en',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Young Explorer fields
  age_group TEXT,
  experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
  feature_ratings JSONB,
  loved_features TEXT[],
  loved_other TEXT,
  improvements TEXT[],
  improvements_other TEXT,
  dream_feature TEXT,
  time_spent TEXT,
  would_return TEXT,
  
  -- Parent/Guardian fields
  child_age_group TEXT,
  heard_from TEXT,
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  first_impressions TEXT[],
  first_impressions_other TEXT,
  expected_price TEXT,
  primary_value TEXT[],
  primary_value_other TEXT,
  concern_ratings JSONB,
  safety_feature_ranking TEXT[],
  child_engagement TEXT[],
  other_platforms TEXT[],
  other_platforms_other TEXT,
  platform_comparison TEXT,
  feature_priorities TEXT[],
  signup_likelihood TEXT,
  recommend_likelihood TEXT,
  questions_and_concerns TEXT,
  feature_suggestions TEXT,
  participation_type TEXT,
  contact_email TEXT,
  contact_frequency TEXT
);

-- Enable Row Level Security
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public form)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback_submissions
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to view their own submissions
CREATE POLICY "Users can view their own feedback"
ON public.feedback_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for analytics queries
CREATE INDEX idx_feedback_type ON public.feedback_submissions(feedback_type);
CREATE INDEX idx_feedback_created_at ON public.feedback_submissions(created_at DESC);
CREATE INDEX idx_feedback_user_id ON public.feedback_submissions(user_id);

-- Add comment for documentation
COMMENT ON TABLE public.feedback_submissions IS 'Stores feedback from both Young Explorers and Parent/Guardian forms';