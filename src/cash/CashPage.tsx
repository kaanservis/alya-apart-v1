import { useMemo, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { buildActiveReservationRows, getFilteredCashSummary } from './cashCalculations'
import { ActiveReservationsSection } from './ActiveReservationsSection'
import { CashFilterBar } from './CashFilterBar'
import { CashSummaryCards } from './CashSummaryCards'
import type { CashFilter } from './types'

interface CashPageProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
}

export function CashPage({ units, reservations }: CashPageProps) {
  const [filter, setFilter] = useState<CashFilter>('month')

  const summary = useMemo(
    () => getFilteredCashSummary(reservations, filter),
    [reservations, filter],
  )

  const activeRows = useMemo(
    () => buildActiveReservationRows(reservations, units, filter),
    [reservations, units, filter],
  )

  return (
    <div className="flex flex-col gap-6">
      <CashFilterBar filter={filter} onFilterChange={setFilter} />
      <CashSummaryCards summary={summary} />
      <ActiveReservationsSection rows={activeRows} />
    </div>
  )
}
