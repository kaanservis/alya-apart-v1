import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, Expense, Reservation } from '../types/database'

export function useReportsData(refreshToken = 0) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReportsData() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        setUnits([])
        setReservations([])
        setExpenses([])
        setError('Supabase bağlantısı yapılandırılmadı.')
        setLoading(false)
        return
      }

      const [unitsResult, reservationsResult, expensesResult] = await Promise.all([
        supabase.from('accommodation_units').select('*').order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true }),
        supabase.from('reservations').select('*').order('giris_tarihi', { ascending: false }),
        supabase.from('expenses').select('*').order('tarih', { ascending: false }),
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

      if (expensesResult.error) {
        setError(expensesResult.error.message)
        setLoading(false)
        return
      }

      setUnits(sortAccommodationUnitsByDisplayOrder((unitsResult.data ?? []) as AccommodationUnit[]))
      setReservations((reservationsResult.data ?? []) as Reservation[])
      setExpenses((expensesResult.data ?? []) as Expense[])
      setError(null)
      setLoading(false)
    }

    void loadReportsData()
  }, [refreshToken])

  return { units, reservations, expenses, loading, error }
}
