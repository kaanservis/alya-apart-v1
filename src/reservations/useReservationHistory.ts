import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, Reservation } from '../types/database'

export interface ReservationHistoryFilters {
  query: string
  unitId: string
  dateFrom: string
  dateTo: string
}

export const EMPTY_HISTORY_FILTERS: ReservationHistoryFilters = {
  query: '',
  unitId: '',
  dateFrom: '',
  dateTo: '',
}

function filterReservations(
  reservations: Reservation[],
  filters: ReservationHistoryFilters,
): Reservation[] {
  const query = filters.query.trim().toLowerCase()

  return reservations.filter((reservation) => {
    if (filters.unitId && reservation.konaklama_birimi_id !== filters.unitId) {
      return false
    }

    if (filters.dateFrom && reservation.cikis_tarihi < filters.dateFrom) {
      return false
    }

    if (filters.dateTo && reservation.giris_tarihi > filters.dateTo) {
      return false
    }

    if (!query) {
      return true
    }

    return (
      reservation.ad_soyad.toLowerCase().includes(query) ||
      reservation.telefon.toLowerCase().includes(query) ||
      (reservation.notlar ?? '').toLowerCase().includes(query)
    )
  })
}

export function useReservationHistory(refreshToken = 0) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filters, setFilters] = useState<ReservationHistoryFilters>(EMPTY_HISTORY_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalRefresh, setInternalRefresh] = useState(0)

  const refetch = useCallback(() => {
    setInternalRefresh((current) => current + 1)
  }, [])

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        setUnits([])
        setReservations([])
        setError('Supabase bağlantısı yapılandırılmadı.')
        setLoading(false)
        return
      }

      const [unitsResult, reservationsResult] = await Promise.all([
        supabase.from('accommodation_units').select('*').order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true }),
        supabase
          .from('reservations')
          .select('*')
          .eq('durum', 'Geçmiş')
          .order('cikis_tarihi', { ascending: false }),
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
      setError(null)
      setLoading(false)
    }

    void loadHistory()
  }, [refreshToken, internalRefresh])

  const filteredReservations = useMemo(
    () => filterReservations(reservations, filters),
    [reservations, filters],
  )

  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units])

  return {
    units,
    reservations: filteredReservations,
    totalCount: reservations.length,
    filters,
    setFilters,
    loading,
    error,
    refetch,
    unitMap,
  }
}
