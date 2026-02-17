-- Security Remediation: Fix RLS Policy Issues

-- 1. Fix user_follows - require authentication to view follows
DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
CREATE POLICY "Authenticated users can view follows" ON user_follows
  FOR SELECT TO authenticated USING (true);

-- 2. Fix image_likes - require authentication to view likes
DROP POLICY IF EXISTS "Anyone can view likes" ON image_likes;
CREATE POLICY "Authenticated users can view likes" ON image_likes
  FOR SELECT TO authenticated USING (true);

-- 3. Fix image_comments - only show comments on accessible images
DROP POLICY IF EXISTS "Anyone can view comments" ON image_comments;
CREATE POLICY "Users can view comments on accessible images" ON image_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generated_images 
      WHERE generated_images.id = image_comments.image_id 
      AND (generated_images.is_public = true OR generated_images.user_id = auth.uid())
    )
  );

-- 4. Remove child visibility of parental controls (security: children shouldn't see blocked keywords)
DROP POLICY IF EXISTS "Children can view their own controls" ON parental_controls;