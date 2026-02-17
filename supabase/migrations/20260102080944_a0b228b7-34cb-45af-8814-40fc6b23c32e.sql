-- Remove email column from profiles table to prevent data exposure
-- Email is already available in auth.users and shouldn't be duplicated

-- First, update the handle_new_user trigger function to not include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

-- Now remove the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;