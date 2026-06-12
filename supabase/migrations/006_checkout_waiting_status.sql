-- Faz 8.3: Çıkış Bugün -> Çıkış Bekliyor

UPDATE accommodation_units
SET status = 'Çıkış Bekliyor'
WHERE status = 'Çıkış Bugün';

ALTER TABLE accommodation_units
  DROP CONSTRAINT IF EXISTS accommodation_units_status_check;

ALTER TABLE accommodation_units
  ADD CONSTRAINT accommodation_units_status_check
  CHECK (status IN ('Boş', 'Dolu', 'Çıkış Bekliyor', 'Temizlik Bekliyor'));
