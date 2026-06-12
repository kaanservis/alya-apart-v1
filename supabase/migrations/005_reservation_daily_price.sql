-- Faz 7: Günlük ücret alanı

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS gunluk_ucret NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gunluk_ucret >= 0);

UPDATE reservations
SET gunluk_ucret = CASE
  WHEN cikis_tarihi > giris_tarihi THEN
    ROUND(toplam_ucret / (cikis_tarihi - giris_tarihi), 2)
  WHEN toplam_ucret > 0 THEN
    toplam_ucret
  ELSE
    0
END
WHERE gunluk_ucret = 0 AND toplam_ucret > 0;
