-- Add selected_persona_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN selected_persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL;