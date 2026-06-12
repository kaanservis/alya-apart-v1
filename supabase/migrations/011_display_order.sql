-- ALYA APART - Oda sabit sıralaması (display_order)

ALTER TABLE accommodation_units
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

UPDATE accommodation_units
SET display_order = CASE name
  WHEN 'Yaren 2' THEN 1
  WHEN 'Belkız 3' THEN 2
  WHEN 'Ayşegül 7' THEN 3
  WHEN 'Berrin 8' THEN 4
  WHEN '201' THEN 5
  WHEN '202' THEN 6
  WHEN '203' THEN 7
  WHEN '204' THEN 8
  WHEN '205' THEN 9
  WHEN '301' THEN 10
  WHEN '302' THEN 11
  WHEN '303' THEN 12
  WHEN '304' THEN 13
  WHEN '305' THEN 14
  ELSE display_order
END;

CREATE INDEX IF NOT EXISTS idx_accommodation_units_display_order
  ON accommodation_units(display_order);
