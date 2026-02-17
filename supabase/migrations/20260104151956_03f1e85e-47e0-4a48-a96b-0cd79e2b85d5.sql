-- Add verification status to parental_controls for child approval workflow
ALTER TABLE public.parental_controls 
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_code text,
ADD COLUMN IF NOT EXISTS verification_requested_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Add constraint for valid verification statuses
ALTER TABLE public.parental_controls 
ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_parental_controls_verification 
ON public.parental_controls(child_user_id, verification_status);

-- Update RLS policies to only allow full parent access when verified
DROP POLICY IF EXISTS "Parents can view parental controls" ON public.parental_controls;

CREATE POLICY "Parents can view parental controls" 
ON public.parental_controls 
FOR SELECT 
USING (auth.uid() = parent_user_id);

-- Allow children to view pending requests for their account
CREATE POLICY "Children can view pending requests for approval" 
ON public.parental_controls 
FOR SELECT 
USING (auth.uid() = child_user_id AND verification_status = 'pending');

-- Allow children to update verification status (approve/reject)
CREATE POLICY "Children can respond to parent requests" 
ON public.parental_controls 
FOR UPDATE 
USING (auth.uid() = child_user_id AND verification_status = 'pending')
WITH CHECK (auth.uid() = child_user_id AND verification_status IN ('approved', 'rejected'));

-- Function to request parental control (generates verification code)
CREATE OR REPLACE FUNCTION public.request_parental_control(
  p_parent_user_id uuid,
  p_child_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_existing_id uuid;
BEGIN
  -- Validate parent is requesting for themselves
  IF auth.uid() IS NULL OR auth.uid() != p_parent_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Prevent self-parenting
  IF p_parent_user_id = p_child_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot set parental controls for yourself');
  END IF;

  -- Check for existing pending/approved request
  SELECT id INTO v_existing_id
  FROM parental_controls
  WHERE parent_user_id = p_parent_user_id 
    AND child_user_id = p_child_user_id
    AND verification_status IN ('pending', 'approved');

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already exists');
  END IF;

  -- Generate 6-digit verification code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');

  -- Create pending parental control request
  INSERT INTO parental_controls (
    parent_user_id, 
    child_user_id, 
    verification_status, 
    verification_code,
    verification_requested_at
  )
  VALUES (
    p_parent_user_id, 
    p_child_user_id, 
    'pending', 
    v_code,
    now()
  )
  ON CONFLICT (parent_user_id, child_user_id) 
  DO UPDATE SET 
    verification_status = 'pending',
    verification_code = v_code,
    verification_requested_at = now(),
    verified_at = NULL;

  RETURN jsonb_build_object('success', true, 'verification_code', v_code);
END;
$$;

-- Function for child to approve/reject parent request
CREATE OR REPLACE FUNCTION public.respond_to_parental_request(
  p_child_user_id uuid,
  p_parent_user_id uuid,
  p_response text,
  p_verification_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stored_code text;
  v_request_id uuid;
BEGIN
  -- Validate child is responding for themselves
  IF auth.uid() IS NULL OR auth.uid() != p_child_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Validate response
  IF p_response NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid response');
  END IF;

  -- Get pending request
  SELECT id, verification_code INTO v_request_id, v_stored_code
  FROM parental_controls
  WHERE parent_user_id = p_parent_user_id 
    AND child_user_id = p_child_user_id
    AND verification_status = 'pending';

  IF v_request_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending request found');
  END IF;

  -- Verify code if approving
  IF p_response = 'approved' THEN
    IF p_verification_code IS NULL OR p_verification_code != v_stored_code THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid verification code');
    END IF;
  END IF;

  -- Update the request
  UPDATE parental_controls
  SET 
    verification_status = p_response,
    verified_at = CASE WHEN p_response = 'approved' THEN now() ELSE NULL END,
    verification_code = NULL -- Clear code after use
  WHERE id = v_request_id;

  RETURN jsonb_build_object('success', true, 'status', p_response);
END;
$$;

-- Update child_activity_log policy to require verified parental controls
DROP POLICY IF EXISTS "Parents can view child activity" ON public.child_activity_log;

CREATE POLICY "Parents can view child activity" 
ON public.child_activity_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parental_controls
    WHERE parental_controls.parent_user_id = auth.uid() 
      AND parental_controls.child_user_id = child_activity_log.child_user_id
      AND parental_controls.verification_status = 'approved'
  )
);

-- Update daily_usage policy to require verified parental controls
DROP POLICY IF EXISTS "Parents can view child usage" ON public.daily_usage;

CREATE POLICY "Parents can view child usage" 
ON public.daily_usage 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parental_controls
    WHERE parental_controls.parent_user_id = auth.uid() 
      AND parental_controls.child_user_id = daily_usage.user_id
      AND parental_controls.verification_status = 'approved'
  )
);

-- Add unique constraint for parent-child pairs
ALTER TABLE public.parental_controls 
DROP CONSTRAINT IF EXISTS unique_parent_child_pair;

ALTER TABLE public.parental_controls 
ADD CONSTRAINT unique_parent_child_pair UNIQUE (parent_user_id, child_user_id);