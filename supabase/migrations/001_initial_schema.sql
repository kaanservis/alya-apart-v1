-- ALYA APART TAKİP SİSTEMİ - Faz 1
-- Konaklama birimleri ve rezervasyon tabloları

CREATE TABLE IF NOT EXISTS accommodation_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Boş'
    CHECK (status IN ('Boş', 'Dolu', 'Çıkış Bugün', 'Temizlik Bekliyor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_soyad TEXT NOT NULL,
  telefon TEXT NOT NULL,
  kisi_sayisi INTEGER NOT NULL CHECK (kisi_sayisi > 0),
  giris_tarihi DATE NOT NULL,
  cikis_tarihi DATE NOT NULL,
  konaklama_birimi_id UUID NOT NULL REFERENCES accommodation_units(id) ON DELETE RESTRICT,
  toplam_ucret NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (toplam_ucret >= 0),
  alinan_ucret NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (alinan_ucret >= 0),
  kalan_bakiye NUMERIC(12, 2) GENERATED ALWAYS AS (toplam_ucret - alinan_ucret) STORED,
  notlar TEXT,
  durum TEXT NOT NULL DEFAULT 'Aktif' CHECK (durum IN ('Aktif', 'Geçmiş')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (cikis_tarihi >= giris_tarihi)
);

CREATE INDEX IF NOT EXISTS idx_reservations_unit_id ON reservations(konaklama_birimi_id);
CREATE INDEX IF NOT EXISTS idx_reservations_durum ON reservations(durum);
CREATE INDEX IF NOT EXISTS idx_accommodation_units_status ON accommodation_units(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accommodation_units_updated_at
  BEFORE UPDATE ON accommodation_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE accommodation_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes konaklama birimlerini okuyabilir"
  ON accommodation_units FOR SELECT
  USING (true);

CREATE POLICY "Herkes rezervasyonları okuyabilir"
  ON reservations FOR SELECT
  USING (true);

CREATE POLICY "Herkes konaklama birimlerini ekleyebilir"
  ON accommodation_units FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes konaklama birimlerini güncelleyebilir"
  ON accommodation_units FOR UPDATE
  USING (true);

CREATE POLICY "Herkes rezervasyon ekleyebilir"
  ON reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes rezervasyon güncelleyebilir"
  ON reservations FOR UPDATE
  USING (true);
