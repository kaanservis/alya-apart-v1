-- Sync reservation.alinan_ucret from payment_records (renamed to alinan_tutar in 014)

DROP TRIGGER IF EXISTS reservation_payment_log ON reservations;

CREATE OR REPLACE FUNCTION sync_reservation_alinan_ucret_from_payments()
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
    alinan_ucret = collected,
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
  EXECUTE FUNCTION sync_reservation_alinan_ucret_from_payments();

INSERT INTO payment_records (reservation_id, amount, payment_date, note)
SELECT
  r.id,
  r.alinan_ucret,
  CURRENT_DATE,
  'Migrasyon tahsilat'
FROM reservations r
WHERE r.alinan_ucret > 0
  AND NOT EXISTS (
    SELECT 1 FROM payment_records pr WHERE pr.reservation_id = r.id
  );

UPDATE reservations r
SET
  alinan_ucret = COALESCE((
    SELECT SUM(amount) FROM payment_records pr WHERE pr.reservation_id = r.id
  ), 0),
  kapora = 0,
  kapora_tahsil = 0,
  giris_te_alinan = 0;
