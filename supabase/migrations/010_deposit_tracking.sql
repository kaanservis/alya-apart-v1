-- Faz 13: Kapora ve ödeme takibi

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS kapora NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (kapora >= 0),
  ADD COLUMN IF NOT EXISTS kapora_tahsil NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (kapora_tahsil >= 0),
  ADD COLUMN IF NOT EXISTS giris_te_alinan NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (giris_te_alinan >= 0),
  ADD COLUMN IF NOT EXISTS cikista_alinacak NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cikista_alinacak >= 0);

UPDATE reservations
SET giris_te_alinan = alinan_ucret
WHERE alinan_ucret > 0 AND giris_te_alinan = 0;

UPDATE reservations
SET cikista_alinacak = GREATEST(toplam_ucret - alinan_ucret, 0)
WHERE cikista_alinacak = 0 AND toplam_ucret > alinan_ucret;
