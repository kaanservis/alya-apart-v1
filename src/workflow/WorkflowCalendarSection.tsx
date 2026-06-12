import type { AccommodationUnit, Reservation } from '../types/database'
import { ReservationCalendarPanel } from '../reservations/ReservationCalendarPanel'

interface WorkflowCalendarSectionProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  seasonYear: number
  onUpdated: () => void
}

export function WorkflowCalendarSection({
  units,
  reservations,
  seasonYear,
  onUpdated,
}: WorkflowCalendarSectionProps) {
  return (
    <ReservationCalendarPanel
      units={units}
      reservations={reservations}
      seasonYear={seasonYear}
      onUpdated={onUpdated}
    />
  )
}
