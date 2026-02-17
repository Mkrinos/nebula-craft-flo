-- Fix function search path warning
ALTER FUNCTION public.generate_secure_share_code() SET search_path = public;