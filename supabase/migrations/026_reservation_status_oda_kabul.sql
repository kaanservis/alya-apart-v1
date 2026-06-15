-- Extended reservation statuses + ODA KABUL tracking

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_durum_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_durum_check
  CHECK (durum IN ('Aktif', 'Geçmiş', 'İptal', 'No Show'));

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS oda_kabul_yapildi BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS oda_kabul_tarihi TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_oda_kabul
  ON reservations (oda_kabul_yapildi)
  WHERE durum = 'Aktif';
