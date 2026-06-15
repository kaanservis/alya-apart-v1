-- ALYA APART - Fix apartments UPDATE RLS (Phase 23)
-- Symptom: .update().select() returns 0 rows with no error (anon client).
-- Cause: missing UPDATE policy or UPDATE policy without WITH CHECK.
-- Safe to re-run.

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes apart profilini güncelleyebilir" ON public.apartments;

CREATE POLICY "Herkes apart profilini güncelleyebilir"
  ON public.apartments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
