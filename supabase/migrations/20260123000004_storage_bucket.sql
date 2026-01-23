-- Create storage bucket for club covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-covers', 'club-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'club-covers' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'club-covers' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated users to update images (optional, if they replace files)
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'club-covers' AND auth.role() = 'authenticated' );
