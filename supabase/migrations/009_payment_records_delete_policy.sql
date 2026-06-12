-- Faz 11: Yedekleme geri yükleme için tahsilat silme izni

CREATE POLICY "Herkes tahsilat kaydı silebilir"
  ON payment_records FOR DELETE
  USING (true);
