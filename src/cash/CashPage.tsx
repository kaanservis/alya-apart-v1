import { useMemo, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { useBatchPaymentSummaries } from '../reservations/useBatchPaymentSummaries'
import { buildActiveReservationRows, getFilteredCashSummary } from './cashCalculations'
import { ActiveReservationsSection } from './ActiveReservationsSection'
import { CashFilterBar } from './CashFilterBar'
import { CashSummaryCards } from './CashSummaryCards'
import type { CashFilter } from './types'

interface CashPageProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  refreshToken?: number
}

export function CashPage({ units, reservations, refreshToken = 0 }: CashPageProps) {
  const [filter, setFilter] = useState<CashFilter>('month')
  const { paymentsByReservation } = useBatchPaymentSummaries(reservations, refreshToken)

  const summary = useMemo(
    () => getFilteredCashSummary(reservations, filter, paymentsByReservation),
    [reservations, filter, paymentsByReservation],
  )

  const activeRows = useMemo(
    () => buildActiveReservationRows(reservations, units, filter, paymentsByReservation),
    [reservations, units, filter, paymentsByReservation],
  )

  return (
    <div className="flex flex-col gap-6">
      <CashFilterBar filter={filter} onFilterChange={setFilter} />
      <CashSummaryCards summary={summary} />
      <ActiveReservationsSection rows={activeRows} />
    </div>
  )
}
