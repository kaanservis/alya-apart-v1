import type { AccommodationUnit, Reservation } from '../types/database'
import { DAY_WIDTH, ROW_HEIGHT, UNIT_LABEL_WIDTH } from './constants'
import { toDateKey } from './dateUtils'
import { buildUnitRowData, getCellState, isDateReserved } from './reservationLogic'
import { ReservationBar } from './ReservationBar'
import { CALENDAR_CELL_STYLES } from './colors'
import type { CalendarZoomLevel } from './types'

interface CalendarUnitRowProps {
  unit: AccommodationUnit
  visibleDates: Date[]
  reservations: Reservation[]
  zoom: CalendarZoomLevel
  isEven?: boolean
  onEmptyCellClick: (unit: AccommodationUnit, date: Date) => void
  onReservationClick: (reservation: Reservation, unit: AccommodationUnit) => void
}

export function CalendarUnitRow({
  unit,
  visibleDates,
  reservations,
  zoom,
  isEven = false,
  onEmptyCellClick,
  onReservationClick,
}: CalendarUnitRowProps) {
  const dayWidth = DAY_WIDTH[zoom]
  const rowHeight = ROW_HEIGHT[zoom]
  const rowData = buildUnitRowData(unit, reservations, visibleDates)
  const reservedIndexes = new Set<number>()

  rowData.segments.forEach((segment) => {
    for (let index = segment.startIndex; index < segment.startIndex + segment.span; index += 1) {
      reservedIndexes.add(index)
    }
  })

  return (
    <div
      className={`relative grid border-b border-blue-100/80 ${isEven ? 'bg-white' : 'bg-slate-50/50'}`}
      style={{
        gridTemplateColumns: `${UNIT_LABEL_WIDTH}px repeat(${visibleDates.length}, ${dayWidth}px)`,
        minHeight: rowHeight,
      }}
    >
      <div className="sticky left-0 z-20 flex items-center border-r border-blue-100 bg-blue-50/90 px-4 text-sm font-bold text-blue-900 backdrop-blur-sm">
        {unit.name}
      </div>

      {visibleDates.map((date, index) => {
        const reservation = isDateReserved(unit.id, date, reservations)
        const cellState = getCellState(unit, date, reservations)
        const isReserved = reservedIndexes.has(index)

        return (
          <button
            key={`${unit.id}-${toDateKey(date)}`}
            type="button"
            aria-label={`${unit.name} - ${toDateKey(date)}`}
            className={`relative border-r border-blue-50 transition-colors ${
              isReserved ? 'cursor-default bg-transparent' : CALENDAR_CELL_STYLES[cellState]
            }`}
            style={{ minHeight: rowHeight }}
            onClick={() => {
              if (!reservation) {
                onEmptyCellClick(unit, date)
              }
            }}
          />
        )
      })}

      <div
        className="pointer-events-none absolute inset-y-0"
        style={{ left: UNIT_LABEL_WIDTH, right: 0 }}
      >
        <div className="pointer-events-auto relative h-full">
          {rowData.segments.map((segment) => (
            <ReservationBar
              key={segment.reservation.id}
              segment={segment}
              dayWidth={dayWidth}
              rowHeight={rowHeight}
              zoom={zoom}
              onSelect={(reservation) => onReservationClick(reservation, unit)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
