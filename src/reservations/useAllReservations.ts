import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Reservation } from '../types/database'

export function useAllReservations(refreshToken: number) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAllReservations() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        setReservations([])
        setError('Supabase bağlantısı yapılandırılmadı.')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .order('giris_tarihi', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        setReservations([])
        setLoading(false)
        return
      }

      setReservations((data ?? []) as Reservation[])
      setError(null)
      setLoading(false)
    }

    void loadAllReservations()
  }, [refreshToken])

  return { reservations, loading, error }
}
