-- ALYA APART - Apartments RLS policies (Phase 21)
-- Fixes: anon client gets 0 rows from apartments → Website Management tabs hidden.
-- Safe to re-run.

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartment_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartments'
      AND policyname = 'Herkes apart profillerini okuyabilir'
  ) THEN
    CREATE POLICY "Herkes apart profillerini okuyabilir"
      ON public.apartments FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartments'
      AND policyname = 'Herkes apart profili ekleyebilir'
  ) THEN
    CREATE POLICY "Herkes apart profili ekleyebilir"
      ON public.apartments FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartments'
      AND policyname = 'Herkes apart profilini güncelleyebilir'
  ) THEN
    CREATE POLICY "Herkes apart profilini güncelleyebilir"
      ON public.apartments FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartment_photos'
      AND policyname = 'Herkes apart fotoğraflarını okuyabilir'
  ) THEN
    CREATE POLICY "Herkes apart fotoğraflarını okuyabilir"
      ON public.apartment_photos FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartment_photos'
      AND policyname = 'Herkes apart fotoğrafı ekleyebilir'
  ) THEN
    CREATE POLICY "Herkes apart fotoğrafı ekleyebilir"
      ON public.apartment_photos FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartment_photos'
      AND policyname = 'Herkes apart fotoğrafını güncelleyebilir'
  ) THEN
    CREATE POLICY "Herkes apart fotoğrafını güncelleyebilir"
      ON public.apartment_photos FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'apartment_photos'
      AND policyname = 'Herkes apart fotoğrafını silebilir'
  ) THEN
    CREATE POLICY "Herkes apart fotoğrafını silebilir"
      ON public.apartment_photos FOR DELETE USING (true);
  END IF;
END $$;
