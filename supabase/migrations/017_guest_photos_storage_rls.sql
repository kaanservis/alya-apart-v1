-- guest-photos bucket storage RLS (idempotent fix)
-- Run this if uploads fail with "new row violates row-level security policy"

INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-photos', 'guest-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Misafir fotoğrafları herkese açık okuma'
  ) THEN
    CREATE POLICY "Misafir fotoğrafları herkese açık okuma"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'guest-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Misafir fotoğrafları yükleme'
  ) THEN
    CREATE POLICY "Misafir fotoğrafları yükleme"
      ON storage.objects FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'guest-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Misafir fotoğrafları güncelleme'
  ) THEN
    CREATE POLICY "Misafir fotoğrafları güncelleme"
      ON storage.objects FOR UPDATE
      TO public
      USING (bucket_id = 'guest-photos')
      WITH CHECK (bucket_id = 'guest-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Misafir fotoğrafları silme'
  ) THEN
    CREATE POLICY "Misafir fotoğrafları silme"
      ON storage.objects FOR DELETE
      TO public
      USING (bucket_id = 'guest-photos');
  END IF;
END $$;

-- guest_photos table RLS (upload also inserts a DB row)
ALTER TABLE IF EXISTS guest_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_photos'
      AND policyname = 'Herkes misafir fotoğraflarını okuyabilir'
  ) THEN
    CREATE POLICY "Herkes misafir fotoğraflarını okuyabilir"
      ON guest_photos FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_photos'
      AND policyname = 'Herkes misafir fotoğrafı ekleyebilir'
  ) THEN
    CREATE POLICY "Herkes misafir fotoğrafı ekleyebilir"
      ON guest_photos FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_photos'
      AND policyname = 'Herkes misafir fotoğrafı güncelleyebilir'
  ) THEN
    CREATE POLICY "Herkes misafir fotoğrafı güncelleyebilir"
      ON guest_photos FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_photos'
      AND policyname = 'Herkes misafir fotoğrafı silebilir'
  ) THEN
    CREATE POLICY "Herkes misafir fotoğrafı silebilir"
      ON guest_photos FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
