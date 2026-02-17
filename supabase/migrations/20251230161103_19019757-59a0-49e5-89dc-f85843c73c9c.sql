-- Create friends table for managing friend relationships
CREATE TABLE public.user_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

-- Users can view their own friend relationships
CREATE POLICY "Users can view their own friendships"
ON public.user_friends FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.user_friends FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update friendships they're part of (accept/decline)
CREATE POLICY "Users can update their friendships"
ON public.user_friends FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their own friend requests or friendships
CREATE POLICY "Users can delete their friendships"
ON public.user_friends FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create shared_playlists table for playlist sharing
CREATE TABLE public.shared_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID NOT NULL,
  share_link TEXT UNIQUE,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_playlists ENABLE ROW LEVEL SECURITY;

-- Users can view playlists shared with them or by them
CREATE POLICY "Users can view their shared playlists"
ON public.shared_playlists FOR SELECT
USING (auth.uid() = shared_by OR auth.uid() = shared_with);

-- Users can share their own playlists
CREATE POLICY "Users can share their playlists"
ON public.shared_playlists FOR INSERT
WITH CHECK (
  auth.uid() = shared_by AND 
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Users can unshare playlists they shared
CREATE POLICY "Users can unshare their playlists"
ON public.shared_playlists FOR DELETE
USING (auth.uid() = shared_by);

-- Add share_code column to playlists for link-based sharing
ALTER TABLE public.playlists ADD COLUMN share_code TEXT UNIQUE;

-- Update playlist SELECT policy to include shared playlists
DROP POLICY IF EXISTS "Users can view their own playlists" ON public.playlists;
CREATE POLICY "Users can view accessible playlists"
ON public.playlists FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR share_code IS NOT NULL
  OR EXISTS (SELECT 1 FROM public.shared_playlists WHERE playlist_id = id AND shared_with = auth.uid())
);