-- ALYA APART - Website images storage bucket (Phase 19)
-- Safe to re-run. Used by Website Management apartment cover + gallery uploads.

ALTER TABLE public.apartment_photos
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Website images public read'
  ) THEN
    CREATE POLICY "Website images public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'website-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Website images upload'
  ) THEN
    CREATE POLICY "Website images upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'website-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Website images update'
  ) THEN
    CREATE POLICY "Website images update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'website-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Website images delete'
  ) THEN
    CREATE POLICY "Website images delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'website-images');
  END IF;
END $$;
