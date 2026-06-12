-- ALYA APART - Website content tables (Phase 17)
-- Safe to re-run. Does NOT modify reservations, accommodation_units, or room tables.
-- Requires: 001_initial_schema.sql (update_updated_at_column function)
--
-- Creates:
--   public.website_settings  (singleton row, id = 'default')
--   public.website_gallery   (homepage + category images)
--   storage bucket: site-photos

CREATE TABLE IF NOT EXISTS public.website_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  site_title TEXT NOT NULL DEFAULT '',
  site_subtitle TEXT NOT NULL DEFAULT '',
  welcome_text TEXT NOT NULL DEFAULT '',
  about_short TEXT NOT NULL DEFAULT '',
  hero_image_path TEXT,
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  maps_embed TEXT NOT NULL DEFAULT '',
  maps_link TEXT NOT NULL DEFAULT '',
  about_content TEXT NOT NULL DEFAULT '',
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  meta_keywords TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  tiktok_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('homepage', 'deniz', 'plaj', 'apart', 'cevre')),
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_gallery_category_sort
  ON public.website_gallery (category, sort_order);

CREATE INDEX IF NOT EXISTS idx_website_gallery_category
  ON public.website_gallery (category);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'website_settings_updated_at'
  ) THEN
    CREATE TRIGGER website_settings_updated_at
      BEFORE UPDATE ON public.website_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_gallery ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_settings'
      AND policyname = 'Herkes site ayarlarını okuyabilir'
  ) THEN
    CREATE POLICY "Herkes site ayarlarını okuyabilir"
      ON public.website_settings FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_settings'
      AND policyname = 'Herkes site ayarlarını güncelleyebilir'
  ) THEN
    CREATE POLICY "Herkes site ayarlarını güncelleyebilir"
      ON public.website_settings FOR UPDATE
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_settings'
      AND policyname = 'Herkes site ayarı ekleyebilir'
  ) THEN
    CREATE POLICY "Herkes site ayarı ekleyebilir"
      ON public.website_settings FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_gallery'
      AND policyname = 'Herkes site galerisini okuyabilir'
  ) THEN
    CREATE POLICY "Herkes site galerisini okuyabilir"
      ON public.website_gallery FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_gallery'
      AND policyname = 'Herkes site galerisi ekleyebilir'
  ) THEN
    CREATE POLICY "Herkes site galerisi ekleyebilir"
      ON public.website_gallery FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_gallery'
      AND policyname = 'Herkes site galerisini güncelleyebilir'
  ) THEN
    CREATE POLICY "Herkes site galerisini güncelleyebilir"
      ON public.website_gallery FOR UPDATE
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'website_gallery'
      AND policyname = 'Herkes site galerisini silebilir'
  ) THEN
    CREATE POLICY "Herkes site galerisini silebilir"
      ON public.website_gallery FOR DELETE
      USING (true);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-photos',
  'site-photos',
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
      AND policyname = 'Site fotoğrafları herkese açık okuma'
  ) THEN
    CREATE POLICY "Site fotoğrafları herkese açık okuma"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'site-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Site fotoğrafları yükleme'
  ) THEN
    CREATE POLICY "Site fotoğrafları yükleme"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'site-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Site fotoğrafları güncelleme'
  ) THEN
    CREATE POLICY "Site fotoğrafları güncelleme"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'site-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Site fotoğrafları silme'
  ) THEN
    CREATE POLICY "Site fotoğrafları silme"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'site-photos');
  END IF;
END $$;

INSERT INTO public.website_settings (
  id,
  site_title,
  site_subtitle,
  welcome_text,
  about_short,
  phone,
  whatsapp,
  instagram,
  facebook,
  email,
  address,
  maps_embed,
  maps_link,
  about_content,
  meta_title,
  meta_description,
  meta_keywords,
  instagram_url,
  facebook_url,
  tiktok_url,
  youtube_url
) VALUES (
  'default',
  'ALYA APART',
  'Avşa Adası''nda denize yakın konforlu konaklama',
  'Avşa Adası''nın sakin atmosferinde denize yakın, temiz ve konforlu bir tatil deneyimi.',
  'ALYA APART, Avşa Adası''nın sakin atmosferinde misafirlerine denize yakın, temiz ve konforlu bir konaklama deneyimi sunar.',
  '+90 532 000 00 00',
  '905320000000',
  '@alyaapart',
  '',
  'info@alyaapart.com',
  'Avşa Merkezi, Avşa Adası, Balıkesir',
  'https://maps.google.com/maps?q=Avsa+Merkezi+Avsa+Adasi+Balikesir&output=embed',
  'https://maps.google.com/?q=Avsa+Merkezi+Avsa+Adasi+Balikesir',
  '<p><strong>ALYA APART</strong>, Avşa Adası''nda 14 odalı apart konaklama imkânı sunar. Denize ve plajlara yürüme mesafesinde, aileler ve çiftler için sakin ve konforlu bir tatil ortamı sağlar.</p><p>Odalarımız temiz, ferah ve ihtiyaç duyduğunuz tüm temel konfora sahiptir. Rezervasyon ve bilgi için WhatsApp veya telefon ile bize ulaşabilirsiniz.</p>',
  'ALYA APART | Avşa Apart Konaklama & Tatil',
  'ALYA APART — Avşa Adası''nda denize yakın konforlu apart konaklama. Avşa apart, Avşa konaklama ve Avşa tatil için 14 oda, plaja yakın merkezi konum.',
  'Avşa Apart, Avşa Konaklama, Avşa Apart Otel, Avşa Tatil, ALYA APART, Avşa Adası konaklama, Avşa denize yakın apart',
  'https://instagram.com/alyaapart',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;
