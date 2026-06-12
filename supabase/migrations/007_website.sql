-- ALYA APART - Faz 10: Web sitesi oda profilleri ve fotoğrafları
-- Not: Idempotent sürüm için 008_website_room_profiles.sql kullanın.

CREATE TABLE IF NOT EXISTS website_room_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_unit_id UUID NOT NULL UNIQUE REFERENCES accommodation_units(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity > 0),
  features TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_unit_id UUID NOT NULL REFERENCES accommodation_units(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_room_photos_unit
  ON website_room_photos(accommodation_unit_id, sort_order);

CREATE TRIGGER website_room_profiles_updated_at
  BEFORE UPDATE ON website_room_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE website_room_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_room_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes oda profillerini okuyabilir"
  ON website_room_profiles FOR SELECT
  USING (true);

CREATE POLICY "Herkes oda profillerini güncelleyebilir"
  ON website_room_profiles FOR UPDATE
  USING (true);

CREATE POLICY "Herkes oda profili ekleyebilir"
  ON website_room_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes oda fotoğraflarını okuyabilir"
  ON website_room_photos FOR SELECT
  USING (true);

CREATE POLICY "Herkes oda fotoğrafı ekleyebilir"
  ON website_room_photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes oda fotoğrafını güncelleyebilir"
  ON website_room_photos FOR UPDATE
  USING (true);

CREATE POLICY "Herkes oda fotoğrafını silebilir"
  ON website_room_photos FOR DELETE
  USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-photos',
  'room-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Oda fotoğrafları herkese açık okuma"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-photos');

CREATE POLICY "Oda fotoğrafları yükleme"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'room-photos');

CREATE POLICY "Oda fotoğrafları güncelleme"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'room-photos');

CREATE POLICY "Oda fotoğrafları silme"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'room-photos');

INSERT INTO website_room_profiles (accommodation_unit_id, description, capacity, features)
SELECT
  id,
  name || ' odamız, denize yakın konumu ve konforlu yaşam alanıyla misafirlerimize huzurlu bir konaklama sunar.',
  CASE
    WHEN name IN ('Yaren 2', 'Belkız 3', 'Ayşegül 7', 'Berrin 8') THEN 4
    ELSE 2
  END,
  ARRAY['Klima', 'Wi-Fi', 'TV', 'Banyo', 'Mutfak', 'Balkon']
FROM accommodation_units
ON CONFLICT (accommodation_unit_id) DO NOTHING;
