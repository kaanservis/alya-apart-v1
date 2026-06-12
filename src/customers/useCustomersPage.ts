import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, PaymentRecord, Reservation } from '../types/database'
import {
  EMPTY_CUSTOMER_FILTERS,
  filterAndSortCustomers,
  type CustomerListFilters,
} from './customerListUtils'

export function useCustomersPage(refreshToken = 0) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
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
        setPaymentRecords([])
        setError('Supabase bağlantısı yapılandırılmadı.')
        setLoading(false)
        return
      }

      const [unitsResult, reservationsResult, paymentsResult] = await Promise.all([
        supabase.from('accommodation_units').select('*').order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true }),
        supabase.from('reservations').select('*').order('giris_tarihi', { ascending: false }),
        supabase.from('payment_records').select('*').order('payment_date', { ascending: false }),
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

      if (paymentsResult.error) {
        setError(paymentsResult.error.message)
        setLoading(false)
        return
      }

      setUnits(sortAccommodationUnitsByDisplayOrder((unitsResult.data ?? []) as AccommodationUnit[]))
      setReservations((reservationsResult.data ?? []) as Reservation[])
      setPaymentRecords((paymentsResult.data ?? []) as PaymentRecord[])
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

  const paymentsByReservation = useMemo(() => {
    const map = new Map<string, PaymentRecord[]>()

    paymentRecords.forEach((record) => {
      const current = map.get(record.reservation_id) ?? []
      current.push(record)
      map.set(record.reservation_id, current)
    })

    return map
  }, [paymentRecords])

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
    paymentsByReservation,
  }
}
