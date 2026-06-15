-- ALYA APART - Ensure apartments.cover_image exists (Phase 22)
-- Safe to re-run. Migrates legacy cover_photo_path values when present.

ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'apartments'
      AND column_name = 'cover_photo_path'
  ) THEN
    UPDATE public.apartments
    SET cover_image = cover_photo_path
    WHERE cover_image IS NULL
      AND cover_photo_path IS NOT NULL
      AND trim(cover_photo_path) <> '';
  END IF;
END $$;
