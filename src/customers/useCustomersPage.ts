import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, Reservation } from '../types/database'
import {
  EMPTY_CUSTOMER_FILTERS,
  filterAndSortCustomers,
  type CustomerListFilters,
} from './customerListUtils'

export function useCustomersPage(refreshToken = 0) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filters, setFilters] = useState<CustomerListFilters>(EMPTY_CUSTOMER_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalRefresh, setInternalRefresh] = useState(0)

  const refetch = useCallback(() => {
    setInternalRefresh((current) => current + 1)
  }, [])

  useEffect(() => {
    async function loadCustomers() {
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
        supabase.from('reservations').select('*').order('giris_tarihi', { ascending: false }),
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

    void loadCustomers()
  }, [refreshToken, internalRefresh])

  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units])

  const rows = useMemo(
    () => filterAndSortCustomers(reservations, unitMap, filters),
    [reservations, unitMap, filters],
  )

  return {
    units,
    reservations,
    rows,
    filters,
    setFilters,
    loading,
    error,
    refetch,
    unitMap,
  }
}
