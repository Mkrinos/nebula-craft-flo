
-- ============ 1) Roles infrastructure (for music_tracks admin gate) ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ 2) music_tracks: restrict INSERT to admins ============
DROP POLICY IF EXISTS "Authenticated users can add music tracks" ON public.music_tracks;
CREATE POLICY "Admins can add music tracks" ON public.music_tracks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by AND public.has_role(auth.uid(), 'admin'));

-- ============ 3) parental_controls verification code hashing ============
ALTER TABLE public.parental_controls
  ADD COLUMN IF NOT EXISTS verification_code_hash text;

-- Migrate existing plaintext codes to hashes (best effort)
UPDATE public.parental_controls
SET verification_code_hash = encode(digest(verification_code, 'sha256'), 'hex')
WHERE verification_code IS NOT NULL AND verification_code_hash IS NULL;

ALTER TABLE public.parental_controls DROP COLUMN IF EXISTS verification_code;

CREATE OR REPLACE FUNCTION public.request_parental_control(p_parent_user_id uuid, p_child_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_hash text;
  v_existing_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_parent_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF p_parent_user_id = p_child_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot set parental controls for yourself');
  END IF;

  SELECT id INTO v_existing_id FROM parental_controls
  WHERE parent_user_id = p_parent_user_id AND child_user_id = p_child_user_id
    AND verification_status IN ('pending','approved');
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already exists');
  END IF;

  v_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  v_hash := encode(digest(v_code, 'sha256'), 'hex');

  INSERT INTO parental_controls (
    parent_user_id, child_user_id, verification_status,
    verification_code_hash, verification_requested_at
  ) VALUES (
    p_parent_user_id, p_child_user_id, 'pending', v_hash, now()
  )
  ON CONFLICT (parent_user_id, child_user_id) DO UPDATE SET
    verification_status = 'pending',
    verification_code_hash = v_hash,
    verification_requested_at = now(),
    verified_at = NULL;

  -- Raw code returned ONLY here, never stored or readable from table
  RETURN jsonb_build_object('success', true, 'verification_code', v_code);
END; $$;

CREATE OR REPLACE FUNCTION public.respond_to_parental_request(
  p_child_user_id uuid, p_parent_user_id uuid, p_response text, p_verification_code text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_stored_hash text;
  v_request_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_child_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF p_response NOT IN ('approved','rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid response');
  END IF;

  SELECT id, verification_code_hash INTO v_request_id, v_stored_hash
  FROM parental_controls
  WHERE parent_user_id = p_parent_user_id AND child_user_id = p_child_user_id
    AND verification_status = 'pending';

  IF v_request_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending request found');
  END IF;

  IF p_response = 'approved' THEN
    IF p_verification_code IS NULL
       OR v_stored_hash IS NULL
       OR encode(digest(p_verification_code, 'sha256'), 'hex') <> v_stored_hash THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid verification code');
    END IF;
  END IF;

  UPDATE parental_controls SET
    verification_status = p_response,
    verified_at = CASE WHEN p_response = 'approved' THEN now() ELSE NULL END,
    verification_code_hash = NULL
  WHERE id = v_request_id;

  RETURN jsonb_build_object('success', true, 'status', p_response);
END; $$;

-- ============ 4) feedback_submissions: enforce contact_email = auth user's email ============
CREATE OR REPLACE FUNCTION public.enforce_feedback_contact_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.contact_email IS NULL OR NEW.contact_email = '' THEN
    RETURN NEW;
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  IF v_email IS NULL OR lower(NEW.contact_email) <> lower(v_email) THEN
    RAISE EXCEPTION 'contact_email must match the signed-in user''s email';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_feedback_contact_email_trg ON public.feedback_submissions;
CREATE TRIGGER enforce_feedback_contact_email_trg
  BEFORE INSERT OR UPDATE OF contact_email ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_contact_email();

-- ============ 5) Storage policy: exact-path match instead of suffix LIKE ============
DROP POLICY IF EXISTS "Authenticated users can view accessible images" ON storage.objects;
CREATE POLICY "Authenticated users can view accessible images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'generated-images'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.generated_images gi
        WHERE gi.is_public = true
          AND split_part(gi.image_url, '/generated-images/', 2) = objects.name
      )
    )
  );
