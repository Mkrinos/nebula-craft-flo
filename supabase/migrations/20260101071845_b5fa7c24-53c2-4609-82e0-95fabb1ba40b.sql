-- Fix music storage deletion policy to only allow users to delete their own files
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can delete their uploads" ON storage.objects;

-- Create a proper ownership-based deletion policy
CREATE POLICY "Users can delete only their own music uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);