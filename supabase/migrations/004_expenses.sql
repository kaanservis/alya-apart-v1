-- Faz 6: Masraf yönetimi tablosu

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  aciklama TEXT NOT NULL,
  tutar NUMERIC(12, 2) NOT NULL CHECK (tutar > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tarih ON expenses(tarih);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes masrafları okuyabilir"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "Herkes masraf ekleyebilir"
  ON expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Herkes masraf güncelleyebilir"
  ON expenses FOR UPDATE
  USING (true);

CREATE POLICY "Herkes masraf silebilir"
  ON expenses FOR DELETE
  USING (true);
