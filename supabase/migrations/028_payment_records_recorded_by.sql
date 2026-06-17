-- payment_records: işlemi yapan kullanıcı + alinan_tutar otomatik senkron

ALTER TABLE payment_records
  ADD COLUMN IF NOT EXISTS recorded_by TEXT;

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
  SET alinan_tutar = collected
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
SET alinan_tutar = COALESCE((
  SELECT SUM(amount) FROM payment_records pr WHERE pr.reservation_id = r.id
), 0);
