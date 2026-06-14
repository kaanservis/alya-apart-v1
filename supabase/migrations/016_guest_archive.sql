-- Guest archive: occupants and identity photos (independent from KBS)

CREATE TABLE IF NOT EXISTS guest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  tc_no TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_entries_reservation_id ON guest_entries(reservation_id);

CREATE TABLE IF NOT EXISTS guest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_entry_id UUID NOT NULL REFERENCES guest_entries(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front_id', 'back_id', 'guest_photo')),
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guest_entry_id, photo_type)
);

CREATE INDEX IF NOT EXISTS idx_guest_photos_guest_entry_id ON guest_photos(guest_entry_id);

ALTER TABLE guest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes misafir kayıtlarını okuyabilir"
  ON guest_entries FOR SELECT
  USING (true);

CREATE POLICY "Herkes misafir kaydı ekleyebilir"
  ON guest_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes misafir kaydı güncelleyebilir"
  ON guest_entries FOR UPDATE
  USING (true);

CREATE POLICY "Herkes misafir kaydı silebilir"
  ON guest_entries FOR DELETE
  USING (true);

CREATE POLICY "Herkes misafir fotoğraflarını okuyabilir"
  ON guest_photos FOR SELECT
  USING (true);

CREATE POLICY "Herkes misafir fotoğrafı ekleyebilir"
  ON guest_photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes misafir fotoğrafı güncelleyebilir"
  ON guest_photos FOR UPDATE
  USING (true);

CREATE POLICY "Herkes misafir fotoğrafı silebilir"
  ON guest_photos FOR DELETE
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-photos', 'guest-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Herkes misafir fotoğraflarını okuyabilir storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'guest-photos');

CREATE POLICY "Herkes misafir fotoğrafı yükleyebilir storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'guest-photos');

CREATE POLICY "Herkes misafir fotoğrafı güncelleyebilir storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'guest-photos');

CREATE POLICY "Herkes misafir fotoğrafı silebilir storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'guest-photos');
