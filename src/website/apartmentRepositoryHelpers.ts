import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase bağlantısı yapılandırılmadı. .env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı olmalı.',
    )
  }

  return supabase
}
