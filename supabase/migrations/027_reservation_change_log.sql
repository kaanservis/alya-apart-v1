-- Rezervasyon oda/tarih değişiklik geçmişi (takvim planlama audit log)
-- Safe to re-run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS reservation_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_room_id UUID NOT NULL REFERENCES accommodation_units(id) ON DELETE RESTRICT,
  new_room_id UUID NOT NULL REFERENCES accommodation_units(id) ON DELETE RESTRICT,
  old_check_in DATE NOT NULL,
  new_check_in DATE NOT NULL,
  old_check_out DATE NOT NULL,
  new_check_out DATE NOT NULL,
  changed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservation_change_log_reservation_id
  ON reservation_change_log(reservation_id);

CREATE INDEX IF NOT EXISTS idx_reservation_change_log_created_at
  ON reservation_change_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_change_log_changed_by
  ON reservation_change_log(changed_by);

ALTER TABLE reservation_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes rezervasyon değişiklik logunu okuyabilir"
  ON reservation_change_log;

CREATE POLICY "Herkes rezervasyon değişiklik logunu okuyabilir"
  ON reservation_change_log
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Herkes rezervasyon değişiklik logu ekleyebilir"
  ON reservation_change_log;

CREATE POLICY "Herkes rezervasyon değişiklik logu ekleyebilir"
  ON reservation_change_log
  FOR INSERT
  WITH CHECK (true);
