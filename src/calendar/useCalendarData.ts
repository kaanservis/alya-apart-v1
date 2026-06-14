import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, Reservation } from '../types/database'
import { UNIT_NAMES } from '../types/database'
import { getSeasonBoundsKeys } from './dateUtils'

function createPlaceholderUnits(): AccommodationUnit[] {
  const now = new Date().toISOString()

  return UNIT_NAMES.map((name, index) => ({
    id: `placeholder-${index}`,
    name,
    display_order: index + 1,
    status: 'Boş' as const,
    created_at: now,
    updated_at: now,
  }))
}

export function useCalendarData(seasonYear: number) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    async function loadCalendarData() {
      if (!isSupabaseConfigured || !supabase) {
        setUnits(createPlaceholderUnits())
        setReservations([])
        setError(
          'Supabase bağlantısı yapılandırılmadı. Takvim oda listesiyle gösteriliyor; rezervasyonlar yüklenemedi.',
        )
        setLoading(false)
        return
      }

      const { start: seasonStart, end: seasonEnd } = getSeasonBoundsKeys(seasonYear)

      const [unitsResult, reservationsResult] = await Promise.all([
        supabase.from('accommodation_units').select('*').order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true }),
        supabase
          .from('reservations')
          .select('*')
          .lte('giris_tarihi', seasonEnd)
          .gte('cikis_tarihi', seasonStart)
          .order('giris_tarihi', { ascending: true }),
      ])

      if (unitsResult.error) {
        setError(unitsResult.error.message)
        setLoading(false)
        return
      }

      if (reservationsResult.error) {
        setError(reservationsResult.error.message)
        setLoading(false)
        return
      }

      setUnits(sortAccommodationUnitsByDisplayOrder((unitsResult.data ?? []) as AccommodationUnit[]))
      setReservations((reservationsResult.data ?? []) as Reservation[])
      setLoading(false)
    }

    void loadCalendarData()
  }, [seasonYear, reloadToken])

  return {
    units,
    reservations,
    loading,
    error,
    reload: () => setReloadToken((current) => current + 1),
  }
}
