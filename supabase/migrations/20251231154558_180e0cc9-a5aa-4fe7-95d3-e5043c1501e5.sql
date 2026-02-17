-- Create parental controls table for parent-child relationships and settings
CREATE TABLE public.parental_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  child_user_id UUID NOT NULL,
  daily_generation_limit INTEGER DEFAULT 20,
  daily_time_limit_minutes INTEGER DEFAULT 60,
  content_filter_level TEXT NOT NULL DEFAULT 'strict',
  blocked_keywords TEXT[] DEFAULT '{}',
  allow_community_viewing BOOLEAN DEFAULT true,
  allow_community_posting BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, child_user_id)
);

-- Create activity log table for tracking child usage
CREATE TABLE public.child_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily usage tracking table
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generations_count INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.parental_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Parental controls policies
CREATE POLICY "Parents can view their controls"
ON public.parental_controls FOR SELECT
USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can create controls"
ON public.parental_controls FOR INSERT
WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can update their controls"
ON public.parental_controls FOR UPDATE
USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents can delete their controls"
ON public.parental_controls FOR DELETE
USING (auth.uid() = parent_user_id);

CREATE POLICY "Children can view their own controls"
ON public.parental_controls FOR SELECT
USING (auth.uid() = child_user_id);

-- Activity log policies
CREATE POLICY "Parents can view child activity"
ON public.child_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parental_controls
    WHERE parent_user_id = auth.uid()
    AND child_user_id = child_activity_log.child_user_id
  )
);

CREATE POLICY "System can insert activity logs"
ON public.child_activity_log FOR INSERT
WITH CHECK (auth.uid() = child_user_id);

-- Daily usage policies
CREATE POLICY "Users can view their own usage"
ON public.daily_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their usage"
ON public.daily_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their usage"
ON public.daily_usage FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Parents can view child usage"
ON public.daily_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parental_controls
    WHERE parent_user_id = auth.uid()
    AND child_user_id = daily_usage.user_id
  )
);

-- Create indexes for performance
CREATE INDEX idx_parental_controls_parent ON public.parental_controls(parent_user_id);
CREATE INDEX idx_parental_controls_child ON public.parental_controls(child_user_id);
CREATE INDEX idx_activity_log_child ON public.child_activity_log(child_user_id);
CREATE INDEX idx_activity_log_created ON public.child_activity_log(created_at DESC);
CREATE INDEX idx_daily_usage_user_date ON public.daily_usage(user_id, usage_date);