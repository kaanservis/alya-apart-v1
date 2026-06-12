import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, Reservation } from '../types/database'
import { UNIT_NAMES } from '../types/database'
import { getSeasonBoundsKeys } from '../calendar/dateUtils'
import { syncUnitStatuses } from './workflowService'
import { normalizeUnitStatus } from './unitStatusLogic'

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

export function useWorkflowData(seasonYear: number) {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1)
  }, [])

  useEffect(() => {
    async function loadWorkflowData() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        setUnits(createPlaceholderUnits())
        setReservations([])
        setError(
          'Supabase bağlantısı yapılandırılmadı. Checkout iş akışı için .env dosyasını yapılandırın.',
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

      try {
        const unitData = sortAccommodationUnitsByDisplayOrder(
          (unitsResult.data ?? []).map((unit) => ({
            ...(unit as AccommodationUnit),
            status: normalizeUnitStatus((unit as AccommodationUnit).status),
          })),
        )
        const reservationData = (reservationsResult.data ?? []) as Reservation[]
        const syncedUnits = await syncUnitStatuses(unitData, reservationData)

        setUnits(syncedUnits)
        setReservations(reservationData)
        setError(null)
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : 'Oda durumları senkronize edilemedi.')
      } finally {
        setLoading(false)
      }
    }

    void loadWorkflowData()
  }, [seasonYear, refreshToken])

  return { units, reservations, loading, error, refetch }
}
