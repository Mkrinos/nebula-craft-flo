-- Make the generated-images bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'generated-images';

-- Drop the public read policy
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Create a new policy that only allows authenticated users to view their own images
-- or images that are marked as public in the generated_images table
CREATE POLICY "Authenticated users can view accessible images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' AND (
    -- User owns the image (uploaded to their folder)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Image is marked as public in the database
    EXISTS (
      SELECT 1 FROM public.generated_images gi
      WHERE gi.image_url LIKE '%' || storage.filename(name)
      AND gi.is_public = true
    )
  )
);