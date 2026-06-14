-- ALYA APART - Website apartment profiles (Phase 18)
-- Safe to re-run. Requires: 012_website_content.sql (site-photos bucket)

CREATE TABLE IF NOT EXISTS public.apartments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  cover_photo_path TEXT,
  feature_near_sea BOOLEAN NOT NULL DEFAULT false,
  feature_wifi BOOLEAN NOT NULL DEFAULT false,
  feature_ac BOOLEAN NOT NULL DEFAULT false,
  feature_kitchen BOOLEAN NOT NULL DEFAULT false,
  feature_balcony BOOLEAN NOT NULL DEFAULT false,
  feature_family_friendly BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.apartment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id TEXT NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartment_photos_apartment_sort
  ON public.apartment_photos (apartment_id, sort_order);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'apartments_updated_at'
  ) THEN
    CREATE TRIGGER apartments_updated_at
      BEFORE UPDATE ON public.apartments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

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

INSERT INTO public.apartments (
  id,
  name,
  description,
  feature_near_sea,
  feature_wifi,
  feature_ac,
  feature_kitchen,
  feature_balcony,
  feature_family_friendly,
  sort_order
) VALUES
  (
    'alya-apart',
    'ALYA APART',
    'Avşa Adası''nda denize yakın, konforlu apart konaklama.',
    true,
    true,
    true,
    true,
    true,
    true,
    0
  ),
  (
    'alya-apart-2',
    'ALYA APART 2',
    'Avşa Adası''nda ikinci apart binamız; sakin ve aile dostu konaklama.',
    true,
    true,
    true,
    true,
    true,
    true,
    1
  )
ON CONFLICT (id) DO NOTHING;
