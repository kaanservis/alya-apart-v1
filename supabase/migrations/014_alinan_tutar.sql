-- Drop cikista_alinacak and stored kalan_bakiye; rename alinan_ucret -> alinan_tutar

ALTER TABLE reservations DROP COLUMN IF EXISTS kalan_bakiye;
ALTER TABLE reservations DROP COLUMN IF EXISTS cikista_alinacak;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'alinan_ucret'
  ) THEN
    ALTER TABLE reservations RENAME COLUMN alinan_ucret TO alinan_tutar;
  END IF;
END $$;

DROP FUNCTION IF EXISTS sync_reservation_alinan_ucret_from_payments() CASCADE;

CREATE OR REPLACE FUNCTION sync_reservation_alinan_tutar_from_payments()
RETURNS TRIGGER AS $$
DECLARE
  target_reservation_id UUID;
  collected NUMERIC(12, 2);
BEGIN
  target_reservation_id := COALESCE(NEW.reservation_id, OLD.reservation_id);

  SELECT COALESCE(SUM(amount), 0)
  INTO collected
  FROM payment_records
  WHERE reservation_id = target_reservation_id;

  UPDATE reservations
  SET
    alinan_tutar = collected,
    kapora = 0,
    kapora_tahsil = 0,
    giris_te_alinan = 0
  WHERE id = target_reservation_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_records_sync_reservation ON payment_records;

CREATE TRIGGER payment_records_sync_reservation
  AFTER INSERT OR UPDATE OR DELETE ON payment_records
  FOR EACH ROW
  EXECUTE FUNCTION sync_reservation_alinan_tutar_from_payments();

UPDATE reservations r
SET
  alinan_tutar = COALESCE((
    SELECT SUM(amount) FROM payment_records pr WHERE pr.reservation_id = r.id
  ), 0),
  kapora = 0,
  kapora_tahsil = 0,
  giris_te_alinan = 0;
