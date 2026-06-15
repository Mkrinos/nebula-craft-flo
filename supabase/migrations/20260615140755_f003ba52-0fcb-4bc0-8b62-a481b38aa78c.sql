ALTER TABLE public.generated_images
  ADD COLUMN IF NOT EXISTS child_given_name TEXT,
  ADD COLUMN IF NOT EXISTS authored_by TEXT,
  ADD COLUMN IF NOT EXISTS spec JSONB;