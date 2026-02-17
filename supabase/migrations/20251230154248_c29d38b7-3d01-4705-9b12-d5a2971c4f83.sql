-- Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public)
VALUES ('music', 'music', true);

-- Create policies for music bucket
CREATE POLICY "Anyone can view music files"
ON storage.objects FOR SELECT
USING (bucket_id = 'music');

CREATE POLICY "Authenticated users can upload music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'music' AND auth.role() = 'authenticated');

-- Create table for music tracks metadata
CREATE TABLE public.music_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  category TEXT NOT NULL DEFAULT 'ambient',
  duration_seconds INTEGER,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can view music tracks (public playlist)
CREATE POLICY "Anyone can view music tracks"
ON public.music_tracks FOR SELECT
USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can add music tracks"
ON public.music_tracks FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own tracks"
ON public.music_tracks FOR DELETE
USING (auth.uid() = uploaded_by);