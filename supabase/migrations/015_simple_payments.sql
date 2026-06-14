-- Stop syncing reservations from payment_records; payments live on reservations.alinan_tutar only

DROP TRIGGER IF EXISTS payment_records_sync_reservation ON payment_records;
DROP TRIGGER IF EXISTS reservation_payment_log ON reservations;
DROP FUNCTION IF EXISTS sync_reservation_alinan_tutar_from_payments();
DROP FUNCTION IF EXISTS sync_reservation_alinan_ucret_from_payments();
