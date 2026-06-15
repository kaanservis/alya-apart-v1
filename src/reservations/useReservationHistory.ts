import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGuestEntriesForReservations } from '../guests/guestService'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
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
  status: 'all' | 'gecmis' | 'iptal' | 'noshow'
}

export const EMPTY_HISTORY_FILTERS: ReservationHistoryFilters = {
  query: '',
  unitId: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
}

function filterReservations(
  reservations: Reservation[],
  filters: ReservationHistoryFilters,
  guestMap: Map<string, GuestEntryWithPhotos[]>,
): Reservation[] {
  const query = filters.query.trim().toLowerCase()

  return reservations.filter((reservation) => {
    if (filters.status === 'gecmis' && reservation.durum !== 'Geçmiş') {
      return false
    }

    if (filters.status === 'iptal' && reservation.durum !== 'İptal') {
      return false
    }

    if (filters.status === 'noshow' && reservation.durum !== 'No Show') {
      return false
    }

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

    const guestMatches = (guestMap.get(reservation.id) ?? []).some((guest) =>
      guest.full_name.toLowerCase().includes(query),
    )

    return (
      reservation.ad_soyad.toLowerCase().includes(query) ||
      reservation.telefon.toLowerCase().includes(query) ||
      (reservation.notlar ?? '').toLowerCase().includes(query) ||
      guestMatches
    )
  })
}

export function useReservationHistory(refreshToken = 0) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [guestMap, setGuestMap] = useState<Map<string, GuestEntryWithPhotos[]>>(new Map())
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
        setGuestMap(new Map())
        setError('Supabase bağlantısı yapılandırılmadı.')
        setLoading(false)
        return
      }

      const [unitsResult, reservationsResult] = await Promise.all([
        supabase.from('accommodation_units').select('*').order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true }),
        supabase
          .from('reservations')
          .select('*')
          .in('durum', ['Geçmiş', 'İptal', 'No Show'])
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

      const loadedReservations = (reservationsResult.data ?? []) as Reservation[]

      let loadedGuestMap = new Map<string, GuestEntryWithPhotos[]>()
      try {
        loadedGuestMap = await fetchGuestEntriesForReservations(
          loadedReservations.map((reservation) => reservation.id),
        )
      } catch (guestError) {
        setError(guestError instanceof Error ? guestError.message : 'Misafir arşivi yüklenemedi.')
        setLoading(false)
        return
      }

      setUnits(sortAccommodationUnitsByDisplayOrder((unitsResult.data ?? []) as AccommodationUnit[]))
      setReservations(loadedReservations)
      setGuestMap(loadedGuestMap)
      setError(null)
      setLoading(false)
    }

    void loadHistory()
  }, [refreshToken, internalRefresh])

  const filteredReservations = useMemo(
    () => filterReservations(reservations, filters, guestMap),
    [reservations, filters, guestMap],
  )

  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units])

  return {
    units,
    reservations: filteredReservations,
    guestMap,
    totalCount: reservations.length,
    filters,
    setFilters,
    loading,
    error,
    refetch,
    unitMap,
  }
}
