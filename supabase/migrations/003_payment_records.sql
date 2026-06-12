-- Faz 5: Tahsilat geçmişi tablosu ve otomatik kayıt

CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_reservation_id ON payment_records(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes tahsilat kayıtlarını okuyabilir"
  ON payment_records FOR SELECT
  USING (true);

CREATE POLICY "Herkes tahsilat kaydı ekleyebilir"
  ON payment_records FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION log_reservation_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.alinan_ucret > 0 THEN
    INSERT INTO payment_records (reservation_id, amount, payment_date, note)
    VALUES (NEW.id, NEW.alinan_ucret, CURRENT_DATE, 'İlk tahsilat');
  ELSIF TG_OP = 'UPDATE' AND NEW.alinan_ucret > OLD.alinan_ucret THEN
    INSERT INTO payment_records (reservation_id, amount, payment_date, note)
    VALUES (
      NEW.id,
      NEW.alinan_ucret - OLD.alinan_ucret,
      CURRENT_DATE,
      'Tahsilat güncellemesi'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservation_payment_log ON reservations;

CREATE TRIGGER reservation_payment_log
  AFTER INSERT OR UPDATE OF alinan_ucret ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_payment_change();
