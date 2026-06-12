-- Faz 3: Rezervasyon silme izni

CREATE POLICY "Herkes rezervasyon silebilir"
  ON reservations FOR DELETE
  USING (true);
